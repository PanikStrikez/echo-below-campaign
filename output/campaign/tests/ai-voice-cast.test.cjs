'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(root,'AI-Voice-Cast.js'),'utf8'),sandbox);
const M = sandbox.ECHO_AI_VOICE_CAST;
const plain = value => JSON.parse(JSON.stringify(value));
const good = {provider:'openai',voiceId:'stock-example',voiceName:'Stock test voice',rights:'provider-stock',auditionId:'isolated-test-sample'};

test('exactly four proposed original DM auditions with stable character links and content revisions', () => {
  const state = M.create();
  assert.deepEqual(plain(state.profiles.map(row=>[row.id,row.characterId])),[['barthen','barthen'],['sildar','sildar'],['dracuseth','dracuseth'],['narrator','']]);
  for (const row of state.profiles) {
    assert.equal(row.audience,'dm');
    assert.equal(row.scriptStatus,'proposed-original-audition');
    assert.equal(row.voice.status,'unselected');
    assert.equal(row.scriptRevision,1);
    assert.match(row.scriptHash,/^fnv1a32:[a-f0-9]{8}$/);
    assert.ok(row.scriptWords>=35&&row.scriptWords<=50,`${row.id}: ${row.scriptWords} words`);
    assert.ok(row.style && row.pacing && row.emotionalRange.length>=4);
    assert.ok(row.sourceRefs.some(source=>source.id==='echo-below:voice-auditions:v1'));
    assert.ok(row.pronunciation.every(rule=>rule.status==='proposed'));
  }
  assert.equal(new Set(state.profiles.map(row=>row.scriptHash)).size,4);
});

test('source references resolve to reviewed local guidance and scripts contain no campaign revelations', () => {
  for (const row of M.catalog) for (const ref of row.sourceRefs) {
    if(ref.id.endsWith(':v1'))continue;
    const [file,id] = ref.id.split('#');
    const contents = fs.readFileSync(path.join(root,file),'utf8');
    assert.ok(contents.includes(id),ref.id);
  }
  const scripts=M.catalog.map(row=>row.script).join('\n');
  assert.doesNotMatch(scripts,/Looking Glass|Halaster|Gundren|Aldric|Below token|Cragmaw|Black Spider|Redbrand|ward catastrophe|returned from death|Nine|courtyard/i);
  assert.doesNotMatch(scripts,/you feel|you are afraid|you remember/i);
  assert.match(M.catalog.find(row=>row.id==='dracuseth').script,/your choice/);
  assert.match(M.catalog.find(row=>row.id==='sildar').script,/what you saw/);
});

test('normalization rejects future versions and keeps only the voice cast allowlist', () => {
  assert.throws(()=>M.normalize({version:2}),/not supported/);
  const saved=plain(M.create());
  saved.credentials={apiKey:'never-export-me'};
  saved.profiles[0].credentials='never-export-me';
  saved.profiles[0].secretNpcKnowledge='spoiler';
  saved.profiles[0].sourceRefs=[{id:'invented',note:'invented'}];
  saved.profiles[0].script='A secret from the future';
  saved.profiles.push({id:'future-villain',script:'spoiler'});
  const result=M.normalize(saved);
  assert.equal(result.profiles.length,4);
  assert.equal(result.profiles[0].script,M.catalog[0].script);
  assert.deepEqual(plain(result.profiles[0].sourceRefs),plain(M.catalog[0].sourceRefs));
  assert.doesNotMatch(JSON.stringify(result),/never-export-me|secretNpcKnowledge|future-villain|invented/);
});

test('cast and normalized snapshots are deeply immutable without modifying input', () => {
  const initial=M.create(), before=JSON.stringify(initial);
  assert.equal(Object.isFrozen(initial),true);
  assert.equal(Object.isFrozen(initial.profiles[0].pronunciation[0]),true);
  assert.throws(()=>{initial.profiles[0].style='changed';},TypeError);
  assert.throws(()=>{M.catalog.push({});},{name:'TypeError'});
  const patch={style:'Softly spoken, clear and practical.',pronunciation:[{term:'Barthen',sayAs:'BAR-thun',status:'confirmed'}]};
  const updated=M.updateProfile(initial,'barthen',patch,{at:'2026-10-05T10:00:00Z'});
  assert.equal(JSON.stringify(initial),before);
  assert.equal(updated.profiles[0].style,patch.style);
  assert.equal(patch.pronunciation[0].status,'confirmed');
  assert.equal(updated.profiles[0].pronunciation[0].status,'proposed');
  assert.equal(updated.profiles[0].revision,2);
  assert.equal(updated.history.length,1);
});

test('suggested voices cannot silently become selected and changing identity invalidates selection', () => {
  let state=M.create();
  state=M.updateProfile(state,'barthen',{voice:{...good,status:'selected',selectedBy:'dm'},proposedVoices:[{...good,status:'selected',selectedBy:'dm'}]});
  assert.equal(M.profile(state,'barthen').voice.status,'proposed');
  assert.equal(M.profile(state,'barthen').proposedVoices[0].status,'proposed');
  assert.throws(()=>M.selectVoice(state,'barthen',good),/explicitly/);
  assert.throws(()=>M.selectVoice(state,'barthen',{...good,rights:'cloned'},true),/consent/);
  assert.throws(()=>M.selectVoice(state,'barthen',{...good,rights:''},true),/licensed/);
  const selected=M.selectVoice(state,'barthen',good,true,{at:'2026-10-05T10:00:00Z'});
  assert.equal(M.profile(selected,'barthen').voice.status,'selected');
  assert.equal(M.profile(selected,'barthen').voice.selectedBy,'dm');
  assert.equal(M.profile(selected,'barthen').voice.selectedAt,'2026-10-05T10:00:00Z');
  const direction=M.updateProfile(selected,'barthen',{style:'Clear and warm.'});
  assert.equal(M.profile(direction,'barthen').voice.status,'selected');
  const replacement=M.updateProfile(direction,'barthen',{voice:{...good,voiceId:'different-stock',status:'selected',selectedBy:'dm'}});
  assert.equal(M.profile(replacement,'barthen').voice.status,'proposed');
  assert.equal(M.profile(replacement,'barthen').voice.selectedBy,'');
  assert.equal(M.profile(M.normalize(plain(selected)),'barthen').voice.status,'selected');
});

test('clearing and undo preserve prior selection and exact prior profile', () => {
  const state=M.create();
  const selected=M.selectVoice(state,'sildar',good,true,{at:'2026-10-05T10:00:00Z'});
  const cleared=M.clearSelection(selected,'sildar');
  assert.equal(M.profile(cleared,'sildar').voice.status,'unselected');
  assert.deepEqual(plain(M.undo(cleared)),plain(selected));
  assert.deepEqual(plain(M.undo(selected)),plain(state));
  assert.deepEqual(plain(M.undo(state)),plain(state));
  assert.throws(()=>M.updateProfile(state,'unknown',{style:'x'}),/known cast member/);
  assert.equal(M.profile(state,'unknown'),null);
});

test('selection preserves the exact model, script fingerprint and sample reference across restore', () => {
  const choice={...good,model:'eleven_multilingual_v2',scriptHash:M.catalog[0].scriptHash,auditionId:'',sampleId:'completed-sample-1'};
  const state=M.selectVoice(M.create(),'barthen',choice,true);
  const restored=M.normalize(plain(state)), voice=M.profile(restored,'barthen').voice;
  assert.equal(voice.model,choice.model);
  assert.equal(voice.scriptHash,choice.scriptHash);
  assert.equal(voice.auditionId,'completed-sample-1');
  assert.equal(voice.status,'selected');
  const changed=M.updateProfile(restored,'barthen',{voice:{...voice,model:'different-model'}});
  assert.equal(M.profile(changed,'barthen').voice.status,'proposed');
  const invalidHash=M.updateProfile(state,'barthen',{voice:{...voice,scriptHash:'secret-not-a-fingerprint'}});
  assert.equal(M.profile(invalidHash,'barthen').voice.scriptHash,'');
});

test('history is bounded and unsafe legacy fields are discarded from historical snapshots', () => {
  let state=M.create();
  for(let index=0;index<35;index++)state=M.updateProfile(state,'narrator',{notes:`revision ${index}`});
  assert.equal(state.history.length,30);
  const imported=plain(state);
  imported.history[0].before.apiKey='secret';
  imported.history[0].apiKey='secret';
  assert.doesNotMatch(JSON.stringify(M.normalize(imported)),/apiKey|secret/);
});

test('audition projection contains only exact shared script and proposed speech direction', () => {
  const before=M.create();
  const edited=M.updateProfile(before,'dracuseth',{notes:'DM-only private note that must not be synthesized.',voice:good});
  const payload=M.audition(edited,'dracuseth');
  assert.deepEqual(Object.keys(payload).sort(),['audience','direction','profileId','profileRevision','script','scriptHash','scriptRevision','status'].sort());
  assert.equal(payload.audience,'dm');
  assert.equal(payload.script,M.catalog.find(row=>row.id==='dracuseth').script);
  assert.equal(payload.scriptHash,M.audition(before,'dracuseth').scriptHash);
  assert.equal(payload.profileRevision,2);
  assert.doesNotMatch(JSON.stringify(payload),/private note|sourceRefs|auditionId|voiceId/);
  assert.equal(Object.isFrozen(payload.direction),true);
});

test('story save normalization preserves an explicitly saved cast without seeding it into campaigns', () => {
  vm.runInNewContext(fs.readFileSync(path.join(root,'Session-01-Story-Data.js'),'utf8'),sandbox);
  const story=sandbox.ECHO_STORY_DATA;
  for(const raw of [{},{contentProfile:'blank'},{voiceCast:null}]) {
    const before=JSON.stringify(raw), result=story.normalize(raw);
    assert.equal(Object.hasOwn(result,'voiceCast'),false);
    assert.equal(JSON.stringify(raw),before);
  }
  const selected=M.selectVoice(M.create(),'sildar',good,true,{at:'2026-10-05T10:00:00Z'});
  const raw={contentProfile:'blank',npcs:[],voiceCast:plain(selected)};
  raw.voiceCast.apiKey='private-account-sentinel';
  raw.voiceCast.profiles[1].secretToken='private-account-sentinel';
  const before=JSON.stringify(raw), result=story.normalize(raw);
  assert.deepEqual(plain(result.voiceCast),plain(selected));
  assert.deepEqual(plain(result.npcs),[]);
  assert.equal(JSON.stringify(raw),before);
  assert.doesNotMatch(JSON.stringify(result),/private-account-sentinel/);
  const restored=story.normalize(JSON.parse(JSON.stringify(result)));
  assert.deepEqual(plain(restored.voiceCast),plain(selected));
});

test('unsupported, malformed or unavailable voice normalization fails without changing the original save', () => {
  const story=sandbox.ECHO_STORY_DATA;
  for(const voiceCast of [{version:99,profiles:[{id:'sildar',voice:{voiceId:'future'}}]},'bad',[]]) {
    const raw={voiceCast}, before=JSON.stringify(raw);
    assert.throws(()=>story.normalize(raw),/original|not supported/);
    assert.equal(JSON.stringify(raw),before);
  }
  const isolated={};
  vm.runInNewContext(fs.readFileSync(path.join(root,'Session-01-Story-Data.js'),'utf8'),isolated);
  assert.throws(()=>isolated.ECHO_STORY_DATA.normalize({voiceCast:plain(M.create())}),/module is unavailable/);
});

test('the actual TV payload allowlist excludes cast, audition notes and source metadata', () => {
  vm.runInNewContext(fs.readFileSync(path.join(root,'Session-01-Reliability.js'),'utf8'),sandbox);
  const cast=M.updateProfile(M.create(),'barthen',{notes:'private-voice-note-sentinel'});
  const payload=sandbox.ECHO_RELIABILITY.publicPayload({sessionName:'Isolated audition check',scene:'test',tokens:[],voiceCast:cast,story:{voiceCast:cast}});
  assert.equal(payload.sessionName,'Isolated audition check');
  assert.doesNotMatch(JSON.stringify(payload),/voiceCast|private-voice-note-sentinel|scriptHash|sourceRefs|BAR-thun/);
});

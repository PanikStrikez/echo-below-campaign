'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const {app,loadedScripts,manifest}=require('../tools/test-support.cjs');
const script=fs.readFileSync(path.join(app,'tools/build-narration.cjs'),'utf8'),files=JSON.parse(script.match(/const files=(\[[^;]+\]);/)[1].replaceAll("'",'"'));
function fixture(){const c=vm.createContext({console,structuredClone,location:{hash:''}});c.window=c;for(const f of files)vm.runInContext(fs.readFileSync(path.join(app,f),'utf8'),c,{filename:f});vm.runInContext(fs.readFileSync(path.join(app,'Waterdeep-Expedition.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(app,'Session-Content-Packs.js'),'utf8'),c);return c;}
const json=v=>JSON.parse(JSON.stringify(v));
const target=(c,e)=>e.path.reduce((x,k)=>x[k],c[e.global]);
function withoutNarration(value){if(Array.isArray(value))return value.map(withoutNarration);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).filter(([k])=>!['read','readAfter','say'].includes(k)).map(([k,v])=>[k,k==='readAloud'?v.map(x=>{const{ text,...rest}=x;return withoutNarration(rest);}):withoutNarration(v)]));}
test('every authored read-aloud has actual paragraphs; unrelated data and empty preparation remain unchanged',()=>{
 const c=fixture(),before=withoutNarration(json(Object.fromEntries(Object.entries(c).filter(([k])=>k.startsWith('ECHO_')))));
 const prep=json(c.ECHO_RUNBOOK.find(b=>b.id==='prep'));
 vm.runInContext(fs.readFileSync(path.join(app,'Campaign-Narration.js'),'utf8'),c);
 const entries=c.ECHO_NARRATION.entries;assert.equal(entries.length,341);
 for(const e of entries){const actual=target(c,e)[e.field],paragraphs=c.ECHO_NARRATION.paragraphs(actual);assert.deepEqual(json(actual),json(e.after),e.id);assert(paragraphs.length>=2,e.id);for(const p of paragraphs)assert(p.length<=1200,e.id);}
 const after=withoutNarration(json(Object.fromEntries(Object.entries(c).filter(([k])=>k.startsWith('ECHO_')&&k!=='ECHO_NARRATION'))));
 assert.deepEqual(after,before);assert.deepEqual(json(c.ECHO_RUNBOOK.find(b=>b.id==='prep')),prep);
 for(const p of c.ECHO_CONTENT_PACKS)for(const b of p.runbook||[])if(b.read?.length)assert(c.ECHO_NARRATION.paragraphs(b.read).length>=2,b.id);
});
test('saved defaults update by ID plus exact text; custom narration and save records remain untouched',()=>{
 const c=fixture();vm.runInContext(fs.readFileSync(path.join(app,'Campaign-Narration.js'),'utf8'),c);
 for(const e of c.ECHO_NARRATION.entries.filter(e=>e.field==='read')){
  const old={id:e.id,read:Array.isArray(e.before)?json(e.before):[e.before],run:['Private unchanged']},before=JSON.stringify(old);
  const result=c.ECHO_NARRATION.upgradeBeat(old);assert.equal(JSON.stringify(old),before);assert(c.ECHO_NARRATION.paragraphs(result.read).length>=2,e.id);assert.deepEqual(result.run,old.run);
  const custom={...old,read:['DM revised this description.']};assert.strictEqual(c.ECHO_NARRATION.upgradeBeat(custom),custom);
  const unknown={...old,id:'custom-unrecognized-'+e.id};assert.strictEqual(c.ECHO_NARRATION.upgradeBeat(unknown),unknown);
 }
 assert.equal(c.ECHO_WATERDEEP_DATA.rooms.length,41);assert.equal(c.ECHO_EXPEDITION.runbook().filter(b=>b.read.length>=2).length,49);
});
test('private catalog is excluded from TV, blank, and fictional campaign loaders',async()=>{
 assert((await loadedScripts()).includes('Campaign-Narration.js'));for(const start of ['blank','example'])assert(!(await loadedScripts(false,false,start)).includes('Campaign-Narration.js'));
 assert(!(await loadedScripts(true)).includes('Campaign-Narration.js'));assert(manifest().echoBelow.includes('Campaign-Narration.js'));
});
test('voice source follows selected exact public narration and invalidates its former text fingerprint',()=>{
 const c=fixture();vm.runInContext(fs.readFileSync(path.join(app,'Voice-Studio-Data.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(app,'Voice-Studio-Sources.js'),'utf8'),c);
 const old=c.ECHO_STAGE6.beats.find(b=>b.id==='s5-open'),ctx={beats:[old],sessionId:'practice',story:{},continuity:{events:[],journal:[]}};
 // Use the same source generator the UI uses, without any audio or provider call.
 const api=c.ECHO_VOICE_STUDIO_SOURCES;assert(api);
 const prior=json(api.collect(ctx).find(x=>x.id==='s5-open'));
 vm.runInContext(fs.readFileSync(path.join(app,'Campaign-Narration.js'),'utf8'),c);
 const current=json(api.collect(ctx).find(x=>x.id==='s5-open'));
 assert.notEqual(current.fingerprint,prior.fingerprint);assert.equal(current.text,old.read.join('\n\n'));assert(current.allowed);assert(!current.text.includes('Cragmaw Castle'));assert(!current.text.toLowerCase().includes('still asleep'));
});

test('authored sources and generated narration catalog stay in sync',()=>{
 require('node:child_process').execFileSync(process.execPath,[path.join(app,'tools/build-narration.cjs'),'--check'],{stdio:'pipe'});
});

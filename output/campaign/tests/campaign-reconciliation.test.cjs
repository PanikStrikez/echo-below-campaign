'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture(fetch=async()=>{throw Error('Offline fixture');}){
 const env=vm.createContext({crypto:require('node:crypto').webcrypto,TextEncoder,setTimeout,clearTimeout,AbortController,fetch,location:{protocol:'http:',hostname:'127.0.0.1'}});
 for(const f of ['Campaign-Outcomes.js','Campaign-Continuity.js','Campaign-Reconciliation.js','AI-Context.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),env);
 const story={continuity:env.ECHO_CONTINUITY.normalize({}),journal:[],evidence:[]},context={campaignId:'practice-test',story};let saves=0;
 env.ECHO_RECONCILIATION.init({context:()=>context,persist:async()=>{saves++;}});
 return {env,story,context,saves:()=>saves,R:env.ECHO_RECONCILIATION,C:env.ECHO_CONTINUITY,O:env.ECHO_OUTCOMES};
}
const plain=v=>JSON.parse(JSON.stringify(v));
test('snapshot only contains explicitly permitted outcome fields; all original save records survive',()=>{
 const f=fixture();f.story.apiKey='SECRET';f.story.party={hp:22};f.story.books=['PRIVATE_BOOK'];f.story.continuity.events.push(f.C.event({id:'secret',approved:true,status:'confirmed',source:'Table',detail:'DM_SECRET',playerText:'OWNER_ONLY',share:'private',recipients:['pc-trista'],knows:['pc-trista'],mystery:{secret:'MYSTERY_EXTRA'}}));
 const before=JSON.stringify(f.story),packet=JSON.stringify(f.R.snapshot(f.context));for(const denied of ['apiKey','PRIVATE_BOOK','MYSTERY_EXTRA','party'])assert(!packet.includes(denied));assert.equal(JSON.stringify(f.story),before);assert(packet.includes('OWNER_ONLY'));
 const player=JSON.stringify(f.env.ECHO_AI_CONTEXT.buildPlayer({...f.context,characterId:'pc-ringgo'}));assert(!player.includes('DM_SECRET')&&!player.includes('OWNER_ONLY'));
});
test('service staging is private, reviewable and idempotent before and after approval',async()=>{
 const f=fixture(),record={id:'service-clue',name:'Found letter',facts:[{text:'PRIVATE_PROPOSAL'}]};
 assert.equal((await f.R.stageServiceRecords([record],'session test')).added,1);assert.equal((await f.R.stageServiceRecords([record],'session test')).added,0);
 const d=f.story.continuity,draft=d.outcomes.drafts[0];assert.equal(d.events.length,0);assert.equal(draft.event.share,'private');assert.equal(draft.event.knows.length,0);assert.equal(draft.event.basis,'Claimed');
 f.O.apply(d,draft.id,f.O.preview(d,draft),{});assert.equal((await f.R.stageServiceRecords([record],'session test')).added,0);assert.equal(d.events.length,1);assert.equal(f.C.publicJournal(d).length,0);
});
test('a malformed selected service batch cannot partially stage outcomes',async()=>{
 const f=fixture();await assert.rejects(f.R.stageServiceRecords([{id:'one',facts:[{text:'valid'}]},{id:'two',facts:[{text:'x'.repeat(2501)}]}],'session test'));
 assert.equal(f.story.continuity.outcomes.drafts.length,0);
});
test('updated facts from the same service record stage a correction of one stable event',async()=>{
 const f=fixture(),record={id:'one-record',name:'Letter',facts:[{text:'Original finding'}]};await f.R.stageServiceRecords([record],'record');const d=f.story.continuity;
 let draft=d.outcomes.drafts[0];f.O.apply(d,draft.id,f.O.preview(d,draft),{});const originalId=d.events[0].id;
 record.facts[0].text='Corrected finding';await f.R.stageServiceRecords([record],'record');draft=d.outcomes.drafts[0];
 assert.equal(draft.target,originalId);assert.equal(d.events[0].detail,'Original finding');assert.equal(draft.event.detail,'Corrected finding');
 f.O.apply(d,draft.id,f.O.preview(d,draft),{});assert.equal(d.events.length,1);assert.equal(d.events[0].id,originalId);assert.equal(d.outcomes.revisions.at(-1).before.detail,'Original finding');
 assert.equal(f.C.normalize(d).events[0].serviceLink.recordId,'one-record');
});
test('current linked facts keep historical chronology and source IDs; uncertainties remain explicit',()=>{
 const f=fixture();for(const [id,holder,basis]of [['old','Captor','Observed'],['new','Inn','Claimed']])f.story.continuity.events.push(f.C.event({id,title:'Gundren',detail:holder,approved:true,status:'confirmed',basis,source:'Table',tracks:[{kind:'rescue',key:'gundren',subject:'Gundren',holder,state:'resolved'}]}));
 const rows=f.R.currentRecords(f.story.continuity);assert.equal(rows.length,1);assert(rows[0].text.includes('Inn'));assert.equal(rows[0].status,'unconfirmed');assert(rows[0].basis.includes('outcome:new'));
 const ai=plain(f.env.ECHO_AI_CONTEXT.buildDM(f.context));assert.equal(ai.records[0].kind,'current-situation');assert(ai.records.some(r=>r.sourceId==='outcome:old'&&r.basis.includes('historical')));assert(ai.records.some(r=>r.sourceId==='outcome:new'));
});
test('offline service leaves enabled durable browser ledger intact and reports a retryable failure',async()=>{
 const f=fixture();f.story.reconciliation=f.R.normalize({enabled:true,head:'a'.repeat(64)});const before=JSON.stringify(f.story);f.R.notify();await new Promise(r=>setTimeout(r,15));
 assert.equal(JSON.stringify(f.story),before);assert(f.R.status().error.includes('Offline'));assert.equal(f.saves(),0);
});
test('a differing service head blocks automatic overwrite',async()=>{
 let mutations=0;const f=fixture(async url=>({ok:true,json:async()=>url.endsWith('bootstrap')?{token:'test-private-token'}:url.endsWith('preview')?{baseHash:'b'.repeat(64),hash:'c'.repeat(64),conflicts:[],changes:[]}:(mutations++,{})}));
 f.story.reconciliation=f.R.normalize({enabled:true,head:'a'.repeat(64)});f.R.notify();await new Promise(r=>setTimeout(r,15));assert.equal(mutations,0);assert(f.R.status().error.includes('disagree'));
});
test('an outcome approved during a mirror request queues the latest version; unrelated saves make no requests',async()=>{
 let head='',revision=0,calls=0,release;const waiting=new Promise(r=>release=r);
 const f=fixture(async(url,options)=>{calls++;if(url.endsWith('bootstrap'))return{ok:true,json:async()=>({token:'local'})};const payload=JSON.parse(options.body);
  if(url.endsWith('preview')){const hash=(payload.snapshot.events.length===1?'a':'b').repeat(64);return{ok:true,json:async()=>({snapshot:payload.snapshot,hash,baseHash:head,expectedRevision:revision,reviewToken:'review',conflicts:[],changes:[{}],unchanged:hash===head})};}
  if(revision===0)await waiting;revision++;head=(payload.snapshot.events.length===1?'a':'b').repeat(64);return{ok:true,json:async()=>({hash:head,receipt:{revision,at:'2026-10-11'}})};
 });
 f.story.reconciliation=f.R.normalize({enabled:true});f.story.continuity.events.push(f.C.event({id:'first',status:'confirmed',approved:true}));f.R.notify();await new Promise(r=>setTimeout(r,5));
 f.story.continuity.events.push(f.C.event({id:'second',status:'confirmed',approved:true}));f.R.notify();release();await new Promise(r=>setTimeout(r,25));
 assert.equal(f.story.reconciliation.head,'b'.repeat(64));assert.equal(revision,2);const before=calls;f.R.notify();await new Promise(r=>setTimeout(r,10));assert.equal(calls,before);
});

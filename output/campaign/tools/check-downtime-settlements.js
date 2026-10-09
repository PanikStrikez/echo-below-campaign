/* In-memory integration. Never reads or writes a saved campaign. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
for(const file of ['Campaign-Continuity','Campaign-Outcomes','Campaign-Downtime','Campaign-Settlements'])require(path.join(root,file+'.js'));
const C=ECHO_CONTINUITY,O=ECHO_OUTCOMES,A=ECHO_DOWNTIME,M=ECHO_SETTLEMENTS;
const before={};vm.createContext(before);vm.runInContext(fs.readFileSync(path.join(root,'archive/downtime-before-2026-10-01/Campaign-Settlements.js'),'utf8'),before);
const old={minutes:50,towns:[{id:'waterdeep',name:'Waterdeep',since:15,sinceId:'old-cursor',notes:'Private prior town note'}],
  jobs:[{id:'old-job',town:'waterdeep',kind:'project',title:'Previous work',requirements:'Preserved terms',proposal:'Possible result',result:'Older review',status:'completed',progress:4,required:4}],
  history:[{id:'old-cursor',town:'waterdeep',at:15,text:'Preserved history',public:false}]};
assert.equal(JSON.stringify(M.normalize(old)),JSON.stringify(before.ECHO_SETTLEMENTS.normalize(old)),'Existing normalized data remains byte-stable');
assert(!Object.hasOwn(M.normalize(old).towns[0],'sinceOutcomeAt'));
const d=C.normalize(),ledger=M.normalize({towns:[{id:'waterdeep',name:'Waterdeep'}]}),story={continuity:d,npcs:[],journal:[],evidence:[],wrapUps:[]},ctx={story,markers:[]};
M.bindContinuity(()=>d);
const raw=M.addJob(ledger,{town:'waterdeep',kind:'deadline',title:'Commission delivery',due:5,proposal:'Possible delivery; not a fact'});
M.advance(ledger,10);
const baseline=JSON.stringify(raw),history=JSON.stringify(ledger.history);
assert.equal(M.due(ledger).length,1);
const begin=(result='completed')=>O.begin(d,{...A.jobDraft(raw,ledger.minutes),detail:'Actual reviewed delivery result',
 downtime:{...A.jobDraft(raw,ledger.minutes).downtime,cost:'No fee charged',result}});
const apply=draft=>{const review=O.preview(d,draft,ctx);assert.deepEqual(review.errors,[]);return O.apply(d,draft.id,review,ctx);};
const draft=begin();assert.equal(M.due(ledger).length,1,'A draft never resolves a deadline');
const e=apply(draft);assert.equal(M.due(ledger).length,0);assert.equal(M.jobView(raw).status,'completed');assert.equal(M.jobView(raw).result,e.detail);assert.equal(M.jobView(raw).outcomeId,e.id);
assert.equal(JSON.stringify(raw),baseline,'Canonical resolution must not rewrite the manual ledger');
assert.equal(JSON.stringify(ledger.history),history,'No duplicate approval history');
let correction=O.begin(d,{},e.id);correction.event.downtime.result='partial';correction.event.detail='Only the first portion arrived';apply(correction);
assert.equal(M.jobView(raw).status,'ready');assert.equal(M.due(ledger).length,1);assert.equal(M.due(ledger)[0].outcomeId,e.id);
assert(C.restore(d));assert.equal(M.due(ledger).length,0);assert(C.restore(d,true));assert.equal(M.due(ledger).length,1);
correction=O.begin(d,{},e.id);correction.event.downtime.result='failed';apply(correction);assert.equal(M.jobView(raw).status,'completed','Failed actual attempt is resolved, not automatically retried');
correction=O.begin(d,{},e.id);correction.event.downtime.result='declined';apply(correction);assert.equal(M.jobView(raw).status,'declined');assert.equal(M.due(ledger).length,0);
O.retire(d,e.id);assert.equal(M.jobView(raw).status,'active');assert.equal(M.due(ledger).length,1,'Withdrawal reopens the original proposal');assert(C.restore(d));assert.equal(M.jobView(raw).status,'declined');
for(const status of ['planned','rumor']){
 const newer=C.event({id:'unfactual-'+status,status,approved:true,detail:'UNPLAYED',downtime:{jobId:raw.id,town:'waterdeep',result:'completed',cost:'None'}});d.events.push(newer);
 assert.equal(M.jobView(raw).status,'declined','Unplayed and rumor events cannot resolve a job');
}
assert.equal(JSON.stringify(raw),baseline);
const reload=C.normalize(JSON.parse(JSON.stringify(d)));M.bindContinuity(()=>reload);assert.equal(M.jobView(raw).status,'declined');M.bindContinuity(()=>d);

// A return window distinguishes earlier outcomes at the same settlement clock value.
const older=d.events.find(x=>x.id===e.id);older.approvedAt='2000-01-01T00:00:00.000Z';
M.leave(ledger,'waterdeep');const departed=ledger.towns[0].sinceOutcomeAt;
assert(!Number.isNaN(Date.parse(departed)));M.leave(ledger,'waterdeep');assert.equal(ledger.towns[0].sinceOutcomeAt,departed,'Duplicate departure does not reset cursor');
assert(!A.returnSummary(d,ledger,'waterdeep').actual.some(x=>x.id===e.id));
const newJob=M.addJob(ledger,{town:'waterdeep',kind:'plan',title:'A second proposal',proposal:'PRIVATE_PENDING_RESULT',due:ledger.minutes});
const newDraft=O.begin(d,{...A.jobDraft(newJob,ledger.minutes),detail:'PRIVATE_COMPLETED_RESULT',publicTitle:'A parcel arrived',playerText:'A small parcel awaits collection.',share:'party',knows:['party'],downtime:{...A.jobDraft(newJob,ledger.minutes).downtime,cost:'No fee'}});
const fresh=apply(newDraft);fresh.approvedAt='2099-01-01T00:00:00.000Z';
const summary=A.returnSummary(d,ledger,'waterdeep');assert(summary.actual.some(x=>x.id===fresh.id));assert.equal(summary.publicChanges.length,1);assert(!A.recap(summary).includes('PRIVATE_'));
assert(!summary.changes.some(x=>x.text.includes('Prepared ')),'Preparation does not masquerade as a town change');
assert.equal(M.normalize(JSON.parse(JSON.stringify(ledger))).towns[0].sinceOutcomeAt,departed);
M.arrive(ledger,'waterdeep');assert.equal(ledger.towns[0].sinceOutcomeAt,departed);
M.bindContinuity(null);assert.equal(M.jobView(raw).status,'active','Unbound compatibility reads original ledger');

// The existing settlement dialog delegates canonically and releases its modal first.
class Node{constructor(tag){this.tagName=tag;this.children=[];this.textContent='';this.value='';this.open=false;}appendChild(n){this.children.push(n);}replaceChildren(){this.children=[];}showModal(){this.open=true;}close(){this.open=false;}}
const page=new Node('body'),flat=n=>[n,...n.children.flatMap(flat)];
global.document={body:page,createElement:t=>new Node(t),activeElement:null};require(path.join(root,'Campaign-Settlements-UI.js'));
const U=ECHO_SETTLEMENTS_UI,extras={settlements:ledger},routed=[],errors=[];
M.bindContinuity(()=>d);
U.init({extras:()=>extras,npcs:()=>[],events:()=>[],toast:e=>errors.push(e),save:()=>{},publish:()=>{},advance:()=>{},
 openDowntime:town=>routed.push(['open',town]),reviewJob:(j,result)=>routed.push(['review',j.id,result]),correctOutcome:id=>routed.push(['correct',id]),returnSummary:town=>A.returnSummary(d,ledger,town)});
const dialog=page.children.at(-1),button=label=>{const n=flat(dialog).find(x=>x.tagName==='button'&&x.textContent===label);assert(n,'Missing button: '+label);n.onclick();};
U.open('shops','waterdeep');assert(flat(dialog).some(n=>n.tagName==='label'&&n.textContent==='Shop / provider'));
button('Between expeditions');assert.equal(dialog.open,false);assert.deepEqual(routed.at(-1),['open','waterdeep']);
U.open('jobs','waterdeep');button('Review / correct recorded result');assert.equal(dialog.open,false);assert.equal(routed.at(-1)[0],'correct');
const pending=M.addJob(ledger,{town:'waterdeep',kind:'plan',title:'Unresolved delivery',proposal:'Not actual yet'});
U.open('jobs','waterdeep');assert(!flat(dialog).some(n=>n.tagName==='label'&&n.textContent==='Actual result to approve'),'Integrated review must not prefill proposed result as actual');
button('Approve this outcome');assert.equal(dialog.open,false);assert.deepEqual(routed.at(-1),['review',pending.id,undefined]);assert.equal(pending.status,'active');
U.open('jobs','waterdeep');button('Decline consequence');assert.equal(dialog.open,false);assert.deepEqual(routed.at(-1),['review',pending.id,'declined']);assert.equal(pending.status,'active');
assert.deepEqual(errors,[]);
console.log('Downtime settlement integration passed: preserved old data; projected deadlines, results, corrections and undo; partial review, withdrawal reopening, no duplicated results; canonical return window and private/public recap separation.');

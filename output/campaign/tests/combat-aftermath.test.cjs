const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');for(const file of ['Session-01-Combat-Aftermath.js','Campaign-Continuity.js','Campaign-Outcomes.js','Session-01-Combat-Data.js'])require(path.join(root,file));
const A=ECHO_COMBAT_AFTERMATH,O=ECHO_OUTCOMES,C=ECHO_CONTINUITY;
const ledger=()=>({events:[],quests:[],outcomes:O.normalize(),undo:[],redo:[],questGuide:{records:{}}});
const plan=()=>ECHO_COMBAT_DATA.normalizePlan(null,'mock-fight');
const context={sessionId:'isolated',encounterId:'mock-fight',sceneId:'road',beatId:'scene-1'};
for(const ending of A.endings)test(ending+' review is private, idempotent and undoable',()=>{
 const d=ledger(),p=plan();A.start(p,context);p.aftermath.ending=ending;p.aftermath.pending='A witness and loot division remain unresolved';p.wrap.loot='Observed chest; contents unconfirmed';const values=A.values(p,{name:'Test fight',sessionName:'Practice'});
 const original=JSON.stringify(d.events),one=O.begin(d,values),two=O.begin(d,values);assert.equal(one.id,two.id);assert.equal(d.outcomes.drafts.length,1);assert.equal(JSON.stringify(d.events),original);
 const review=O.preview(d,one);assert.deepEqual(review.errors,[]);const e=O.apply(d,one.id,review);assert.equal(e.combatAftermath.ending,ending);assert.equal(C.publicJournal(d).length,0);assert.equal(A.approved(d,p.aftermath.runKey).id,e.id);assert.equal(d.events.length,1);
 const correction=O.begin(d,values);assert.equal(correction.target,e.id);correction.event.detail='Corrected actual result';O.apply(d,correction.id,O.preview(d,correction));assert.equal(d.events.length,1);assert.equal(d.events[0].detail,'Corrected actual result');assert(C.restore(d));assert.equal(d.events[0].id,e.id);assert.equal(d.events[0].detail,e.detail);assert(C.restore(d,true));assert.equal(d.events.length,1);
});
test('new fight has a distinct key, retains old full notes, clears proposed loot and normalizes',()=>{
 const p=plan();A.start(p,context);const old=p.aftermath.runKey;p.wrap.loot='Old full notes';p.aftermath.ending='victory';A.start(p,context,true);assert.notEqual(p.aftermath.runKey,old);assert.equal(p.wrap.loot,'');assert.equal(p.aftermathHistory[0].wrap.loot,'Old full notes');assert.equal(ECHO_COMBAT_DATA.normalizePlan(p,'mock-fight').aftermath.runKey,p.aftermath.runKey);
});
test('duplicate fight events and stale preview are rejected',()=>{
 const d=ledger(),p=plan();A.start(p,context);p.aftermath.ending='victory';const draft=O.begin(d,A.values(p,{name:'Test'})),review=O.preview(d,draft);draft.event.detail='Changed since preview';assert.throws(()=>O.apply(d,draft.id,review),/changed/);const event=O.apply(d,draft.id,O.preview(d,draft));const extra=O.begin(d,{title:'Other',detail:'Different',source:'DM'});extra.event.combatAftermath=event.combatAftermath;assert(O.preview(d,extra).errors.some(e=>e.includes('already has an aftermath')));
});
test('zero HP observations never infer death, grant resources or complete quests',()=>{
 const p=plan();A.start(p,context);assert.throws(()=>A.values(p,{name:'Test'}),/Choose/);p.aftermath.ending='negotiation';p.wrap.casualties='Foe: 0 HP; fate unconfirmed';const v=A.values(p,{name:'Test'});assert(v.detail.includes('fate unconfirmed'));assert.equal(v.quests,undefined);assert.equal(v.tracks,undefined);assert.equal(v.share,'private');
});

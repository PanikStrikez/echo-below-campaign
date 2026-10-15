const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');global.localStorage={getItem:()=>null,setItem:()=>{}};require(path.join(root,'Session-Encounter-Flow.js'));require(path.join(root,'Campaign-Continuity.js'));require(path.join(root,'Campaign-Outcomes.js'));
const F=ECHO_ENCOUNTER_FLOW,O=ECHO_OUTCOMES;
test('overview uses only prepared observable narration and question, never conditional revelations',()=>{
 const beat={id:'test',title:'Test',read:['The doorway stands open. A lamp is burning.','A staircase descends beside the counter.'],ask:['What do you inspect?'],run:['PRIVATE_TACTICS'],private:['PRIVATE_HISTORY'],flowVersion:1};global.ECHO_SESSION4_FLOW={byId:{test:{record:['Record who found the key.'],source:'Book p. 1',reveal:['PRIVATE_REVELATION']}}};const b=F.brief(beat);assert.equal(b.situation,'The doorway stands open.');assert.equal(b.question,'What do you inspect?');assert.deepEqual(b.information,['A staircase descends beside the counter.']);assert(!JSON.stringify(b).includes('PRIVATE'));assert.equal(beat.read.length,2);
 const context=F.reviewContext('group/session',beat);assert.deepEqual(context.prompts,['Record who found the key.']);assert.equal(context.source,'Book p. 1');
});
test('scene recording prompts persist in one private draft and never become event facts',()=>{
 const d={events:[],quests:[],outcomes:O.normalize(),undo:[],redo:[],questGuide:{records:{}}},sceneGuide={key:'practice/session',beatId:'shop',title:'Shop',prompts:['PRIVATE_PROMPT: Who received the letter?'],source:'Preparation reference'};
 const one=O.begin(d,{title:'Shop outcome',detail:'The party spoke to the shopkeeper.',source:'DM',status:'confirmed',sceneGuide}),again=O.begin(d,{title:'Other proposed title',sceneGuide});assert.equal(one.id,again.id);assert.equal(d.outcomes.drafts.length,1);const restored=O.normalize(d.outcomes);assert.deepEqual(restored.drafts[0].sceneGuide,sceneGuide);assert.equal(one.event.sceneGuide,undefined);assert.equal(d.events.length,0);const applied=O.apply(d,one.id,O.preview(d,one));assert.equal(applied.sceneGuide,undefined);assert(!JSON.stringify(ECHO_CONTINUITY.publicJournal(d)).includes('PRIVATE_PROMPT'));
});
test('drafts from different campaign/session contexts remain separate',()=>{
 const d={events:[],quests:[],outcomes:O.normalize(),undo:[],redo:[],questGuide:{records:{}}};const a=O.begin(d,{sceneGuide:{key:'a/session',beatId:'shop'}}),b=O.begin(d,{sceneGuide:{key:'b/session',beatId:'shop'}});assert.notEqual(a.id,b.id);
});

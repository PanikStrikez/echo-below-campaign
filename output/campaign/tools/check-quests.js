const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');global.window=global;global.location={hash:'',protocol:'file:'};
for(const f of ['Campaign-Quests-Data.js','Campaign-Quests.js','Campaign-Quests-UI.js','Campaign-Continuity.js','Session-01-Story-Data.js'])require(path.join(root,f));
const Q=ECHO_QUESTS,C=ECHO_CONTINUITY;let story=ECHO_STORY_DATA.normalize(),d=C.ensure(story),g=d.questGuide;
assert.equal(ECHO_QUEST_CATALOG.quests.length,40);assert.equal(ECHO_QUEST_CATALOG.quests.reduce((n,q)=>n+q.steps.length,0),146);
const ids=new Set(ECHO_QUEST_CATALOG.quests.map(q=>q.id));assert.equal(ids.size,40);
for(const q of ECHO_QUEST_CATALOG.quests){for(const id of q.requires)assert(ids.has(id));assert(q.goal&&q.dm&&q.reward&&q.fallback&&q.source&&q.leads.length>=2);assert(new Set(q.steps.map(s=>s.id)).size===q.steps.length);}
assert(g.enabled);assert.equal(g.currentAct,'prologue');assert.equal(C.ensure(ECHO_STORY_DATA.normalize(),'other-campaign').questGuide.enabled,false);
assert.equal(Q.publicCards(d).length,0);assert.equal(Q.privateClues(d,'pc-trista').length,0);
assert.equal(Q.cards(d).find(q=>q.id==='sildar').status,'completed');Q.record(g,'sildar');assert.equal(Q.cards(d).find(q=>q.id==='sildar').status,'completed','Opening an imported quest must preserve actual outcome');
assert.equal(Q.cards(d).find(q=>q.id==='gundren').status,'active');assert(!Q.recommendations(d).some(q=>q.id==='sildar'));
let r=Q.record(g,'character-trista');r.notes='SECRET Mara contract';r.draft={title:'A private lead',text:'Speak privately with an old acquaintance.'};C.checkpoint(d);Q.publication(d,'character-trista','pc-trista');
assert.equal(Q.publicCards(d).length,0);assert.equal(Q.privateClues(d,'pc-pebble').length,0);assert.equal(Q.privateClues(d,'pc-trista').length,1);assert(!JSON.stringify(Q.privateClues(d,'pc-trista')).includes('SECRET'));assert.throws(()=>Q.publication(d,'character-trista','pc-aldric'));
const restored=ECHO_STORY_DATA.normalize(JSON.parse(JSON.stringify(story)));assert.deepEqual(restored.continuity.questGuide,g,'Full campaign backup roundtrip');
assert(C.restore(d));assert.equal(Q.privateClues(d,'pc-trista').length,0);assert(C.restore(d,true));assert.equal(Q.privateClues(d,'pc-trista').length,1);
g=d.questGuide;C.checkpoint(d);Q.change(d,'character-trista','step',{id:'character-trista-1',state:'completed',result:'Mara offered a private meeting.'},'Session test');assert.equal(Q.privateClues(d,'pc-trista').length,0,'Progress withdraws prior publication');assert.equal(Q.cards(d).find(q=>q.id==='character-trista').status,'planned','Objective does not auto-activate or complete the whole quest');
assert.throws(()=>Q.change(d,'character-trista','step',{id:'not-a-step',state:'completed',result:'x'},'DM'));assert.throws(()=>Q.change(d,'character-trista','status',{status:'completed',result:''},'DM'));
r=Q.record(g,'echo-below');r.draft={title:'The Echo Below',text:'Investigate the Redbrands and find Gundren.'};Q.publication(d,'echo-below','party');assert.equal(Q.tvQuest(d).text,r.draft.text);r.draft.text='Unreviewed secret';assert(!JSON.stringify(Q.tvQuest(d)).includes('Unreviewed'));assert(!JSON.stringify(Q.tvQuest(d)).includes('Ilyra'));assert(!JSON.stringify(Q.tvQuest(d)).includes('Looking Glass'));
Q.change(d,'echo-below','status',{status:'paused',result:'Party chose a detour.'},'DM');assert.equal(Q.publicCards(d).length,0);assert(!Q.recommendations(d).some(q=>q.id==='echo-below'));
// Actual UI interaction: no unsafe HTML; objective editing, publication and undo.
class Node{constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.value='';this.text='';this.classList={add(){},toggle(){}};}set textContent(v){this.text=String(v);}get textContent(){return this.text;}append(...c){this.children.push(...c);}replaceChildren(...c){this.children=c;}addEventListener(e,f){this.listeners[e]=f;}setAttribute(){}}
global.document={createElement:t=>new Node(t)};global.confirm=()=>true;
const rootNode=new Node('root'),messages=[];const host={continuity:()=>d,sessionName:()=> 'QA rehearsal',save:()=>{},toast:t=>messages.push(t),showText:()=>{}};
const render=()=>{rootNode.replaceChildren();ECHO_QUESTS_UI.render(rootNode,host);};global.ECHO_STORY_UI={render,open:()=>{}};
const flat=n=>[n,...n.children.flatMap(flat)];const find=(tag,text)=>flat(rootNode).find(n=>n.tagName===tag&&n.textContent===text);const field=label=>{const n=find('label',label);assert(n,label);return n.children[0];};const click=text=>{const b=find('button',text);assert(b,text);b.listeners.click();};
render();assert(find('h3','Quest guide'));assert(find('h3','Next leads'));field('Player-safe title').value='Public objective';field('Current objective and known leads').value='Find the missing dwarf.';click('Show main quest on TV');assert.equal(Q.tvQuest(d).title,'Public objective');click('Hide main quest from TV');assert.equal(Q.publicCards(d).length,0);click('Undo quest change');assert.equal(Q.tvQuest(d).title,'Public objective');
const status=field('Objective result');status.value='completed';field('What happened / next lead').value='Witness named the Redbrands.';field('Source, session or witness').value='QA witness';click('Record this objective');assert.equal(d.questGuide.records['echo-below'].steps['echo-below-1'].result,'Witness named the Redbrands.');assert.equal(Q.publicCards(d).length,0);
assert.equal(messages.length,0);
console.log('Quest checks passed: 40 quests, 146 objectives, actual-history migration, save/restore, undo/redo, manual outcomes, immutable reviewed publication, owner isolation, and rendered UI actions.');
// Player-view tab uses the same projections as transmission, and never publishes on selection.
let main=Q.record(d.questGuide,'echo-below');main.draft={title:'TV objective',text:'Find the missing dwarf.'};Q.publication(d,'echo-below','party');
let personal=Q.record(d.questGuide,'character-trista');personal.draft={title:'TRISTA ONLY',text:'Arrange a discreet meeting.'};Q.publication(d,'character-trista','pc-trista');
const beforePreview=JSON.stringify(d);
const preview=()=>{rootNode.replaceChildren();ECHO_QUESTS_UI.renderPreview(rootNode,host);};ECHO_STORY_UI.render=preview;
const textTree=()=>flat(rootNode).map(n=>n.textContent).join('\n');
preview();assert(textTree().includes('TV objective'));assert(!textTree().includes('TRISTA ONLY'));click('Trista’s phone');assert(textTree().includes('TRISTA ONLY'));assert(!textTree().includes('SECRET Mara'));click('Pebble’s phone');assert(!textTree().includes('TRISTA ONLY'));assert(textTree().includes('No character quest is currently published'));click('Phones · shared quests');assert(!textTree().includes('TV objective'));assert(!textTree().includes('TRISTA ONLY'));assert.equal(JSON.stringify(d),beforePreview);
console.log('Quest preview passed: TV, shared phones, owner-specific preview and no publication/state changes while browsing.');

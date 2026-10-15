const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Node{constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.value='';this.text='';this.hidden=false;this.classList={add(){},toggle(){},remove(){}};this.dataset={};}set textContent(v){this.text=String(v);}get textContent(){return this.text;}append(...c){this.children.push(...c);}replaceChildren(...c){this.children=c;}addEventListener(e,fn){this.listeners[e]=fn;}setAttribute(){}scrollIntoView(){}}
const roots=new Map();global.document={getElementById:id=>{if(!roots.has(id))roots.set(id,new Node('div'));return roots.get(id);},createElement:t=>new Node(t),querySelectorAll:()=>[],querySelector:()=>null};
document.body={dataset:{},style:{setProperty(){}}};global.window={addEventListener(){}};global.location={search:''};global.navigator={};global.history={};
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'phone/phone.js'),'utf8');
// Run actual composer/request rendering; omit the page's auto-refresh boot.
const stop=source.indexOf("  window.addEventListener('online'");
assert(stop>0,'Phone page boot boundary is available');
vm.runInThisContext(source.slice(0,stop)+`\n globalThis.__phoneUI={openActionRequest,renderActionRequests,renderTurnGuide,renderCombatPrompts,set:v=>latest=v,draft:()=>actionDraft};\n})();`);
const view={actionProtocol:1,character:{id:'pc-test',name:'Hero',attacks:[{name:'Sword',attackBonus:5}],actions:[],spells:[],resources:[]},tokens:[{id:'foe',name:'Visible enemy'}],turn:{activeId:'other'},actionRequests:[]};__phoneUI.set(view);__phoneUI.renderTurnGuide(view);
assert(!document.getElementById('turn-guide').hidden,'Out-of-turn actions/reactions must remain available');
const flat=n=>[n,...n.children.flatMap(flat)];const find=(id,tag,text)=>flat(document.getElementById(id)).find(n=>n.tagName===tag&&n.textContent===text);
__phoneUI.openActionRequest('attack',0);const composer=document.getElementById('action-composer');
const enemy=flat(composer).find(n=>n.tagName==='label'&&n.children.some(x=>x.textContent==='Visible enemy')).children[0];enemy.checked=true;enemy.listeners.change();assert.deepEqual(__phoneUI.draft().targetIds,['foe']);
const textarea=flat(composer).find(n=>n.tagName==='textarea');textarea.value='Attack from the doorway';textarea.listeners.input();
__phoneUI.renderTurnGuide(view);__phoneUI.renderActionRequests(view);assert.equal(__phoneUI.draft().note,'Attack from the doorway');assert.equal(flat(composer).find(n=>n.tagName==='textarea'),textarea,'Polling must preserve draft DOM/focus');
let sent;global.fetch=async(url,opts)=>{sent=JSON.parse(opts.body);return {ok:true,json:async()=>({queued:true})};};
(async()=>{
 await find('action-composer','button','Send for DM review').listeners.click();assert.equal(sent.actionName,'Sword');assert.deepEqual(sent.targetIds,['foe']);assert.equal(sent.kind,'action-request');assert(sent.requestId);
 const r={id:sent.requestId,label:'Sword',actionType:'attack',actionIndex:0,revision:2,status:'needs clarification',message:'Which target?',targetIds:['foe'],targetNames:['Visible enemy'],note:'Old intent',mode:'normal'};
 view.actionRequests=[r];__phoneUI.renderActionRequests(view);find('action-requests','button','Revise').listeners.click();assert.equal(__phoneUI.draft().expectedRevision,2);
 await find('action-composer','button','Send revision').listeners.click();assert.equal(sent.kind,'action-revise');assert.equal(sent.expectedRevision,2);
 await find('action-requests','button','Cancel request').listeners.click();assert.equal(sent.kind,'action-cancel');assert.equal(sent.requestId,r.id);
 r.status='resolved';r.rolls=[{label:'Sword',notation:'1d20+5',parts:[10],total:15}];__phoneUI.renderActionRequests(view);assert(!find('action-requests','button','Revise'));assert(!find('action-requests','button','Cancel request'));
 assert(flat(document.getElementById('action-requests')).some(n=>n.textContent.includes('= 15')));
 view.combatPrompts={saves:[{id:'save-a',label:'Burst',ability:'dex',bonus:2,mode:'normal',status:'waiting',total:null,revision:3}],reactions:[{id:'pause-a',label:'Incoming attack',status:'waiting',note:''}]};__phoneUI.renderCombatPrompts(view);
 await find('combat-prompts','button','Roll saving throw').listeners.click();assert.equal(sent.kind,'save-response');assert.equal(sent.expectedRevision,3);assert.equal(sent.method,'digital');
 const total=flat(document.getElementById('combat-prompts')).find(n=>n.tagName==='input'&&n.type==='number');total.value='17';total.listeners.input();await find('combat-prompts','button','Send physical-dice total').listeners.click();assert.equal(sent.total,17);assert.equal(sent.method,'physical');
 await find('combat-prompts','button','Pass').listeners.click();assert.equal(sent.pauseId,'pause-a');assert.equal(sent.response,'pass');
 view.character.spells=[{name:'Web',level:2,prepared:true}];view.character.resources=[{id:'slot-2',name:'2nd-level spell slots',slotLevel:2,current:1,max:2}];view.character.favorites=['spell:Web'];__phoneUI.renderTurnGuide(view);assert(flat(document.getElementById('turn-guide')).some(n=>n.tagName==='strong'&&n.textContent==='Web'));find('turn-guide','button','Ask to cast').listeners.click();
 const slot=flat(composer).find(n=>n.tagName==='label'&&n.textContent==='Cast using').children[0];slot.value='slot-2';slot.listeners.change();__phoneUI.draft().targetIds=['foe'];__phoneUI.draft().note='Cover the doorway';await find('action-composer','button','Send for DM review').listeners.click();assert.equal(sent.casting.resourceId,'slot-2');assert.equal(sent.casting.effect,'Cover the doorway');
 view.combatPrompts.saves[0].status='passed';view.combatPrompts.saves[0].total=17;view.combatPrompts.reactions[0].status='pass';__phoneUI.renderCombatPrompts(view);view.combatPrompts={};__phoneUI.renderCombatPrompts(view);assert(!document.getElementById('combat-prompts').hidden,'Closed responses retain their last-received history');assert(flat(document.getElementById('combat-prompts')).some(n=>n.textContent.includes('total 17')));assert(!find('combat-prompts','button','Roll saving throw'));__phoneUI.renderCombatPrompts({character:{id:'another-player'},combatPrompts:{}});assert(document.getElementById('combat-prompts').hidden,'Reassignment excludes the previous player response history');
 console.log('Phone UI passed: out-of-turn requests, target selection, persistent draft, canonical action submission, revision, cancellation, and resolved roll/status display.');
})().catch(e=>{console.error(e);process.exitCode=1;});

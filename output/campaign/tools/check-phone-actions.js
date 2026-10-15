const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');global.window=global;global.location={hash:'',protocol:'file:'};
for(const f of ['Session-01-Story-Data.js','Session-01-Map-Data.js','Session-01-Town-Maps.js','Session-01-Party-Data.js','Session-01-Combat-Data.js','Session-01-Combat-Run.js','Session-01-Reliability.js','Session-01-Combat-Plus.js','Session-01-Phone-Actions.js'])require(path.join(root,f));
const src=fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8'),boot=src.lastIndexOf('  if (IS_PLAYER) initPlayer();');
require('./test-support.cjs').loadTableContent();
vm.runInThisContext(src.slice(0,boot)+`\n globalThis.__phoneTest={normalize,newCustomState,publicState,phoneSnapshot,sync:syncPartyFromTokens,set:s=>{state=s;campaignIndex={sessions:[],story:{},rules:null,combatLibrary:[],tableExtras:{}};},conditions:CONDITIONS};\n})();`);
global.ECHO_PHONE_ACTION_CONDITIONS=__phoneTest.conditions;
const api=ECHO_PHONE_ACTIONS,clone=structuredClone;
function fresh(){const s=__phoneTest.normalize(__phoneTest.newCustomState());const actor=s.tokens.find(t=>t.id==='pc-pebble'),foe={...clone(actor),id:'foe-test',name:'Test enemy',team:'enemy',type:'goblin'};s.tokens.push(foe);s.combat.tokens[foe.id]=ECHO_COMBAT_DATA.creatureDefense('goblin');
 actor.placed=foe.placed=true;actor.scene=foe.scene=s.scene;actor.conditions=[];foe.conditions=[];actor.hp=10;actor.maxHp=30;foe.hp=foe.maxHp=30;foe.ac=12;foe.tempHp=3;
 const sh=s.party[actor.id];sh.hp=10;sh.maxHp=30;sh.conditions=[];sh.concentration='';sh.resources=[{id:'wind',name:'Second Wind',current:1,max:1,unit:'uses'},{id:'slot-1',name:'Level 1 slots',current:2,max:2,unit:'slots'}];
 sh.attacks=[{name:'Hammer',type:'Action',attackBonus:5,damageDice:'1d8+3',damageType:'bludgeoning',effect:'Attack one target.'}];
 sh.actions=[{name:'Second Wind',type:'Bonus action',attackBonus:null,damageDice:'1d10+3',effect:'Regain hit points.',resourceId:'wind',cost:1},{name:'Focus',type:'Action',attackBonus:null,effect:'Concentration on a harmless glow.',resourceId:'slot-1',cost:1}];
 sh.spells=[{name:'Unmapped spell',level:1,prepared:true,notes:'Describe a utility effect.'}];
 s.turn={scene:s.scene,round:1,order:[actor.id,foe.id],index:0};s.combatRun.queue={key:`${s.scene}:1:${actor.id}`,done:[],movementUsed:0,actionUsed:false,bonusUsed:false};
 return {s,actor,foe};}
let n=0;function receive(s,type,index,targets,note=''){const view=ECHO_PARTY_DATA.ownerView(s.party['pc-pebble']);return api.receive(s,{kind:'action-request',requestId:`test-${++n}`,characterId:'pc-pebble',scene:s.scene,actionType:type,actionIndex:index,actionName:view[{attack:'attacks',action:'actions',spell:'spells'}[type]][index].name,entry:view[{attack:'attacks',action:'actions',spell:'spells'}[type]][index],targetIds:targets,note,mode:'normal'},s.tokens.filter(t=>t.placed).map(t=>t.id));}
function prep(s,r,change=()=>{},dice=()=>4){const plan=api.initialPlan(s,r);plan.acknowledged=true;plan.reactionsChecked=true;change(plan);return api.prepare(s,r,plan,{visible:s.tokens.filter(t=>t.placed).map(t=>t.id),die:dice,saveBonus:()=>0});}
function apply(s,review){return api.apply(s,review,s.tokens.filter(t=>t.placed).map(t=>t.id));}
{
 let {s,actor}=fresh();const r=receive(s,'action',0,[actor.id]),before=clone(s);const rev=prep(s,r);assert.deepEqual(s,before,'Preview must not mutate state');s=apply(s,rev);
 assert.equal(s.party[actor.id].resources[0].current,0);assert.equal(s.tokens.find(t=>t.id===actor.id).hp,17);assert(s.combatRun.queue.bonusUsed);assert.deepEqual(s.phoneActions.requests[0].transitions.map(t=>t.status),['waiting','approved','resolved']);
 assert.throws(()=>apply(s,rev),/no longer/,'Duplicate approval must not spend twice');
 __phoneTest.set(s);__phoneTest.sync();s=__phoneTest.normalize(JSON.parse(JSON.stringify(s)));const restored=api.undo(s,r.id);assert.equal(restored.party[actor.id].resources[0].current,1);assert.equal(restored.tokens.find(t=>t.id===actor.id).hp,10);assert(!restored.combatRun.queue.bonusUsed);assert.equal(restored.phoneActions.requests[0].status,'undone');
 assert.equal(restored.rolls.length,0);s.party[actor.id].resources[0].current=1;assert.throws(()=>api.undo(s,r.id),/value changed/);
}
{
 let {s,actor,foe}=fresh();s.combat.tokens[foe.id].resistances='bludgeoning';s.combat.tokens[foe.id].concentration='Secret hex';foe.conditions=['Concentrating'];
 const r=receive(s,'attack',0,[foe.id]);const rev=prep(s,r,()=>{},sides=>sides===20?10:6);s=apply(s,rev);
 assert.equal(s.tokens.find(t=>t.id===foe.id).hp,29);assert.equal(s.tokens.find(t=>t.id===foe.id).tempHp,0);assert(s.combatRun.queue.actionUsed);
 const out=JSON.stringify(api.publicRequests(s,actor.id));assert(!out.includes('Secret hex'));assert(!out.includes('concentration DC'));assert(!out.includes('signature'));assert(!out.includes('patches'));
 __phoneTest.set(s);assert(!JSON.stringify(__phoneTest.publicState()).includes('phoneActions'));
 assert.equal(__phoneTest.phoneSnapshot().actionRequests[actor.id].length,1);assert.equal(__phoneTest.phoneSnapshot().actionRequests['pc-trista'].length,0);
 const after=api.undo(s,r.id);assert.equal(after.tokens.find(t=>t.id===foe.id).hp,30);assert.equal(after.tokens.find(t=>t.id===foe.id).tempHp,3);
}
{
 let {s,actor,foe}=fresh();s.combat.tokens[foe.id].concentration='Secret';foe.conditions=['Concentrating'];let i=0;const r=receive(s,'attack',0,[foe.id]);const rev=prep(s,r,()=>{},sides=>sides===20?(++i===1?20:1):4);s=apply(s,rev);
 assert.equal(s.combat.tokens[foe.id].concentration,'');assert(!s.tokens.find(t=>t.id===foe.id).conditions.includes('Concentrating'));assert.equal(rev.rolls[1].parts.length,2,'Critical doubles dice');
 assert.equal(api.undo(s,r.id).combat.tokens[foe.id].concentration,'Secret');
}
{
 let {s,actor}=fresh();const r=receive(s,'action',1,[actor.id]);s=apply(s,prep(s,r));assert.equal(s.party[actor.id].concentration,'Focus');assert(s.tokens.find(t=>t.id===actor.id).conditions.includes('Concentrating'));assert.equal(s.party[actor.id].resources[1].current,1);
 __phoneTest.set(s);__phoneTest.sync();s=__phoneTest.normalize(JSON.parse(JSON.stringify(s)));const u=api.undo(s,r.id);assert.equal(u.party[actor.id].concentration,'');assert(!u.tokens.find(t=>t.id===actor.id).conditions.includes('Concentrating'));
}
{
 let {s,actor,foe}=fresh();const r=receive(s,'action',0,[actor.id]);const rev=prep(s,r);s.tokens.find(t=>t.id===foe.id).hp--;assert.throws(()=>apply(s,rev),/table changed/);
 const e={kind:'action-cancel',requestId:r.id,characterId:'pc-trista',expectedRevision:r.revision};assert.throws(()=>api.receive(s,e,[actor.id]),/changed/);e.characterId=actor.id;api.receive(s,e,[actor.id]);assert.equal(r.status,'cancelled');assert.throws(()=>apply(s,rev),/no longer/);
}
{
 let {s,actor,foe}=fresh();const r=receive(s,'attack',0,[foe.id]);let entry=api.definition(s,r);const e={kind:'action-revise',requestId:r.id,characterId:actor.id,expectedRevision:1,scene:s.scene,actionType:'attack',actionIndex:0,actionName:entry.name,entry,targetIds:[actor.id],note:'Different target',mode:'advantage'};
 api.receive(s,e,[actor.id,foe.id]);assert.equal(r.revision,2);assert.deepEqual(r.targetIds,[actor.id]);assert.throws(()=>api.receive(s,e,[actor.id]),/changed/);api.receive(s,{...e,kind:'action-request'},[actor.id]);assert.equal(s.phoneActions.requests.length,1);
 assert.throws(()=>api.receive(s,{...e,kind:'action-request',characterId:'pc-trista'},[actor.id]),/unavailable/);
}
{
 let {s,actor,foe}=fresh();const r=receive(s,'attack',0,[foe.id]);assert.throws(()=>prep(s,r,p=>p.steps[0].targetId='hidden'),/hidden/);assert.throws(()=>prep(s,r,p=>p.steps[0].cover='full'),/full cover/);s.turn.index=1;assert.throws(()=>prep(s,r),/not that character/);s.turn.index=0;s.combatRun.queue.actionUsed=true;assert.throws(()=>prep(s,r),/already used/);
}
{
 let {s,actor}=fresh();let r=receive(s,'spell',0,[],'Open the door');assert.throws(()=>prep(s,r),/spell slot/);assert.doesNotThrow(()=>prep(s,r,p=>{p.costs=[{id:'slot-1',delta:-1}];p.override='DM approves the utility effect; no automatic target change.';}));
 r=receive(s,'action',0,[actor.id]);assert.throws(()=>prep(s,r,p=>p.costs=[]),/cost is missing/);s.party[actor.id].resources[0].current=0;assert.throws(()=>prep(s,r),/unavailable/);
}
{
 let {s,actor,foe}=fresh();const r=receive(s,'attack',0,[foe.id,actor.id]);const rev=prep(s,r,p=>{for(const step of p.steps)Object.assign(step,{kind:'save',dc:12,success:'half',notation:'2d6',damageType:'fire',sharedRoll:'area',condition:'Prone',conditionWhen:'hit'});},sides=>sides===20?15:4);
 assert.equal(rev.rolls.filter(r=>r.notation==='2d6').length,1,'Area damage rolled once');s=apply(s,rev);assert.equal(s.tokens.find(t=>t.id===foe.id).hp,29);assert(!s.tokens.find(t=>t.id===foe.id).conditions.includes('Prone'));
}
// Fake DOM: prepare is read-only, resolution commits once, history undo remains accessible.
class Node{constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.dataset={};this.value='';this.text='';}set textContent(v){this.text=String(v);}get textContent(){return this.text;}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}addEventListener(e,fn){this.listeners[e]=fn;}}
global.document={createElement:tag=>new Node(tag)};require(path.join(root,'Session-01-Phone-Actions-UI.js'));
let {s,actor}=fresh(),r=receive(s,'action',0,[actor.id]),dom=new Node('div'),commits=0,error='';
const ui=ECHO_PHONE_ACTIONS_UI;ui.init({state:()=>s,root:()=>dom,show:()=>{},toast:m=>error=m,visible:()=>[actor.id],conditions:()=>ECHO_PHONE_ACTION_CONDITIONS,prepare:(id,plan)=>api.prepare(s,s.phoneActions.requests.find(r=>r.id===id),plan,{visible:[actor.id],die:()=>4,saveBonus:()=>0}),resolve:review=>{s=apply(s,review);commits++;},undo:id=>{s=api.undo(s,id);commits++;ui.render();},status:(id,status,message)=>{const row=s.phoneActions.requests.find(r=>r.id===id);row.revision++;api.transition(row,status,message);ui.render();}});
const nodes=n=>[n,...n.children.flatMap(nodes)],press=text=>{const b=nodes(dom).find(n=>n.tagName==='button'&&n.textContent===text);assert(b,text);b.listeners.click();};
ui.open(r.id);press('Prepare rolls & preview');assert.match(error,/Review targets/);const checkbox=nodes(dom).find(n=>n.tagName==='label'&&n.children.some(c=>c.textContent==='I checked the targets, timing, full effect, costs, and any exceptions')).children.find(n=>n.tagName==='input');checkbox.checked=true;checkbox.listeners.change();press('Prepare rolls & preview');assert.equal(commits,0);const reactions=nodes(dom).find(n=>n.tagName==='label'&&n.children.some(c=>c.textContent==='Reactions have been resolved or passed')).children.find(n=>n.tagName==='input');reactions.checked=true;reactions.listeners.change();press('Prepare rolls & preview');press('Approve & resolve together');assert.equal(commits,1);assert.equal(s.phoneActions.requests[0].status,'resolved');press('Undo this resolution');assert.equal(commits,2);assert.equal(s.phoneActions.requests[0].status,'undone');
console.log('Phone actions passed: atomic resolution, resources, HP/temp HP, defenses, shared area rolls, concentration, turn usage, revisions/cancel, deduplication, stale previews, owner privacy, save/restore, conflict-aware undo, and DM review controls.');

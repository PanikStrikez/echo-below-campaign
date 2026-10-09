const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');global.window=global;global.location={hash:'',protocol:'file:'};
for(const f of ['Session-01-Story-Data.js','Session-01-Map-Data.js','Session-01-Town-Maps.js','Session-01-Party-Data.js','Session-01-Combat-Data.js','Session-01-Combat-Run.js','Session-01-Reliability.js','Session-01-Combat-Plus.js','Session-01-Phone-Actions.js'])require(path.join(root,f));
const source=fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8'),boot=source.lastIndexOf('  if (IS_PLAYER) initPlayer();');vm.runInThisContext(source.slice(0,boot)+`\n globalThis.__plus={normalize,newCustomState,publicState,phoneSnapshot,set:s=>{state=s;campaignIndex={sessions:[],story:{},rules:null,combatLibrary:[],tableExtras:{}};},conditions:CONDITIONS};\n})();`);global.ECHO_PHONE_ACTION_CONDITIONS=__plus.conditions;
const api=ECHO_COMBAT_PLUS,clone=structuredClone;
function fresh(){const s=__plus.normalize(__plus.newCustomState()),a=s.tokens.find(t=>t.id==='pc-pebble'),b=s.tokens.find(t=>t.id==='pc-aldric');const enemy={...clone(a),id:'enemy-test',name:'Guard',team:'enemy',type:'goblin'};s.tokens.push(enemy);s.combat.tokens[enemy.id]=ECHO_COMBAT_DATA.creatureDefense('goblin');
 for(const [i,t]of [a,b,enemy].entries()){t.placed=true;t.scene=s.scene;t.visible=true;t.x=10+i*10;t.y=30;t.hp=t.maxHp=30;t.tempHp=0;t.ac=12;t.conditions=[];s.combat.tokens[t.id]||=ECHO_COMBAT_DATA.creatureDefense(t.type);if(s.party[t.id]){s.party[t.id].hp=s.party[t.id].maxHp=30;s.party[t.id].ac=12;s.party[t.id].speed=30;s.party[t.id].concentration='';}}
 s.turn={scene:s.scene,round:1,order:[a.id,enemy.id,b.id],index:0};s.combatRun.queue={key:`${s.scene}:1:${a.id}`,done:[],actionUsed:false,bonusUsed:false,movementUsed:0};s.combatPlus=api.normalize();s.combatPlus.calibration[s.scene]={columns:20,feet:5,metric:'grid'};return {s,a,b,enemy};}
const area=(s,shape,extra={})=>{const a={id:api.id(),scene:s.scene,name:'Test spell',shape,owner:'pc-pebble',anchor:'pc-pebble',tick:'start',remaining:2,triggers:['entry','start','end'],difficult:true,public:false,active:true,concentration:'',note:'Secret effect instructions',...extra};api.own(s).areas.push(a);return a;};
const shape={kind:'square',x1:15,y1:20,x2:25,y2:40};
{
 let {s,a}=fresh();area(s,shape);let p=api.movementPreview(s,a.id,[{x:10,y:30},{x:30,y:30}]);assert.equal(p.length,20);assert.equal(p.cost,30);assert.equal(p.difficult,10);assert.equal(p.remaining,0);
 a.conditions=['Prone'];p=api.movementPreview(s,a.id,[{x:10,y:30},{x:30,y:30}]);assert.equal(p.cost,50,'Crawl + difficult terrain costs 3 per foot inside, 2 outside');assert.throws(()=>api.applyMovement(s,{actorId:a.id,path:p.path,reactionsChecked:true}),/exceeds/);a.conditions=[];
 const result=api.applyMovement(s,{actorId:a.id,path:p.path,reactionsChecked:true});assert.equal(result.tokens.find(t=>t.id===a.id).x,30);assert.equal(result.combatRun.queue.movementUsed,30);assert.equal(result.combatPlus.reminders.filter(r=>r.title.includes('entry')).length,1);assert.equal(a.x,10,'Movement is pure until commit');
 assert.throws(()=>api.movementPreview(s,a.id,[{x:11,y:30},{x:20,y:30}]),/moved/);assert.throws(()=>api.movementPreview(s,a.id,[{x:10,y:30},{x:NaN,y:30}]),/valid/);
}
{
 let {s,a,enemy}=fresh();enemy.x=10;enemy.y=30;const path=[{x:10,y:30},{x:20,y:30}],p=api.movementPreview(s,a.id,path);assert(p.opportunities.includes(enemy.id));assert.throws(()=>api.applyMovement(s,{actorId:a.id,path}),/opportunity/);
 const pause=api.pause(s,{label:'Opportunity',targets:[a.id]});assert.throws(()=>api.applyMovement(s,{actorId:a.id,path,reactionsChecked:true,pauseId:pause.id}),/reaction window/);pause.status='closed';assert.doesNotThrow(()=>api.applyMovement(s,{actorId:a.id,path,reactionsChecked:true,pauseId:pause.id}));
 a.conditions=['Restrained'];assert.equal(api.speed(s,a),0);a.conditions=[];a.exhaustion=2;s.party[a.id].rules='2014';assert.equal(api.speed(s,a),15);s.party[a.id].rules='2024 character exception';assert.equal(api.speed(s,a),20);
}
{
 let {s,a,b,enemy}=fresh();area(s,shape);enemy.x=10;enemy.y=30;
 let placed=api.placeToken(s,a.id,{x:20,y:30});assert(placed.changed);assert.equal(placed.state.tokens.find(t=>t.id===a.id).x,20);assert.equal(a.x,10,'Direct placement is reviewable before committing');
 assert(placed.state.combatRun.queue.movementUsed>0);assert(placed.state.combatPlus.reminders.some(r=>r.title.includes('entry')));assert(placed.notes.some(n=>n.includes('opportunity')));
 placed=api.placeToken(s,b.id,{x:95,y:95});assert.equal(placed.state.tokens.find(t=>t.id===b.id).x,95,'Out-of-turn placement is allowed');assert(placed.notes.some(n=>n.includes('outside')));
 enemy.type='unknown-creature';delete s.combat.creatures[enemy.type];placed=api.placeToken(s,enemy.id,{x:40,y:45});assert.equal(placed.state.tokens.find(t=>t.id===enemy.id).x,40,'A token without a speed can still be placed');
 s.phoneRequests=[{id:'move-request',kind:'move',scene:s.scene,characterId:a.id,x:24,y:28}];
 const restoredMove=__plus.normalize(JSON.parse(JSON.stringify(s))).phoneRequests[0];
 assert.equal(restoredMove.kind,'move');assert.equal(restoredMove.x,24);assert.equal(restoredMove.y,28);
}
{
 let {s,a,b}=fresh();const batch=api.saveBatch(s,{label:'Fire burst',ability:'dex',dc:13,targets:[a.id,b.id],mode:'advantage'},()=>2);
 const one=api.saveResult(s,{batchId:batch.id,characterId:a.id,expectedRevision:1,method:'digital'},()=>10);assert.equal(one.total,12);assert.equal(one.status,'failed');assert.equal(one.parts.length,2);
 assert.throws(()=>api.saveResult(s,{batchId:batch.id,characterId:a.id,expectedRevision:1,method:'digital'},()=>20),/no longer/);
 const two=api.saveResult(s,{batchId:batch.id,characterId:b.id,expectedRevision:1,method:'physical',total:15},()=>1);assert.equal(two.status,'passed');assert(!JSON.stringify(api.phone(s,a.id)).includes('"dc":'));assert.equal(api.phone(s,a.id).saves.length,1);
 const pause=api.pause(s,{label:'Shield?',targets:[a.id]});const publicPause=api.phone(s,a.id).reactions[0];assert.equal(publicPause.id,pause.id,'Pause id must not be overwritten by character id');assert.equal(api.phone(s,b.id).reactions.length,0);
 assert.throws(()=>api.reactionReply(s,{pauseId:pause.id,characterId:b.id,response:'pass'}),/changed/);api.reactionReply(s,{pauseId:pause.id,characterId:a.id,response:'request',note:'Shield'});assert.equal(pause.targets[0].status,'request');assert.throws(()=>api.reactionReply(s,{pauseId:pause.id,characterId:a.id,response:'pass'}),/changed/);
}
function job(s,targets,extra={}){const j={id:api.id(),scene:s.scene,status:'staged',label:'Damage test',targets,components:[{amount:10,type:'slashing',attack:true,magical:false,overrides:{}},{amount:7,type:'fire',magical:true,overrides:{}}],reactionsChecked:true,...extra};s.combatPlus.damage.push(j);return j;}
{
 let {s,a,b}=fresh();a.tempHp=4;s.combat.tokens[a.id].resistances='slashing from nonmagical attacks that are not silvered';s.combat.tokens[a.id].immunities='fire';const j=job(s,[a.id]);let rows=api.damagePreview(s,j);assert.deepEqual(rows[0].rows.map(r=>r.adjusted),[5,0]);assert.equal(rows[0].hp,29);j.components[0].silvered=true;assert.equal(api.damagePreview(s,j)[0].rows[0].adjusted,10);j.components[0].magical=true;assert.equal(api.damagePreview(s,j)[0].rows[0].adjusted,10);
 s.combat.tokens[a.id].immunities='fire while inside the forge';assert.throws(()=>api.damagePreview(s,j),/conditional/);j.components[1].overrides[a.id]='none';assert.doesNotThrow(()=>api.damagePreview(s,j));
 s.combatPlus.defenses[a.id]=[{id:'frozen',type:'fire',kind:'vulnerabilities',when:'manual',label:'DM confirmed frozen state'}];j.components[1].overrides[a.id]='auto';s.combat.tokens[a.id].immunities='';j.components[1].activeRules=['frozen'];assert.equal(api.damagePreview(s,j)[0].rows[1].adjusted,14);
 const stamp=api.damageSignature(s,j);a.hp--;assert.throws(()=>api.applyDamage(s,j,stamp),/table changed/);const result=api.applyDamage(s,j,api.damageSignature(s,j));assert.equal(result.combatPlus.damage[0].status,'resolved');assert.throws(()=>api.applyDamage(result,result.combatPlus.damage[0],api.damageSignature(result,result.combatPlus.damage[0])),/already/);
}
{
 let {s,a,b,enemy}=fresh();const sh=s.party[b.id];sh.spells=[{name:'Shield',level:1,prepared:true}];sh.resources=[{id:'slots',name:'1st-level spell slots',current:2,max:2}];s.combat.tokens[b.id].reactionUsed=false;
 const pause=api.pause(s,{label:'Incoming attack',targets:[b.id]}),j=job(s,[b.id],{actorId:enemy.id,pauseId:pause.id,attack:{total:16,natural:11,crit:20,cover:0}});
 assert.throws(()=>api.damagePreview(s,j),/paused/);api.shield(s,b.id,'slots');assert.equal(b.ac,17);assert.equal(sh.resources[0].current,1);assert(s.combat.tokens[b.id].reactionUsed);assert.throws(()=>api.shield(s,b.id,'slots'),/already used/);pause.status='closed';const r=api.damagePreview(s,j)[0];assert(!r.hit);assert.equal(r.total,0);
 api.turnPoint(s,b.id,'end');assert.equal(b.ac,17);api.turnPoint(s,b.id,'start');assert.equal(b.ac,12);assert.equal(sh.ac,12);
}
{
 let {s,a,b}=fresh();const batch=api.saveBatch(s,{label:'Burst',ability:'dex',dc:13,targets:[a.id,b.id]},()=>2),j=job(s,[a.id,b.id],{saveBatchId:batch.id,success:'half'});assert.throws(()=>api.damagePreview(s,j),/every/);
 api.saveResult(s,{batchId:batch.id,characterId:a.id,expectedRevision:1,method:'physical',total:13},()=>1);api.saveResult(s,{batchId:batch.id,characterId:b.id,expectedRevision:1,method:'physical',total:12},()=>1);const rows=api.damagePreview(s,j);assert.equal(rows[0].total,8);assert.equal(rows[1].total,17,'Components individually halve rounded down');
}
{
 let {s,a,b}=fresh();a.x=20;const ar=area(s,shape);api.turnPoint(s,a.id,'start');assert.equal(ar.remaining,1);assert.equal(s.combatPlus.reminders.length,1);api.turnPoint(s,a.id,'end');assert.equal(s.combatPlus.reminders.length,2);s.turn.round++;api.turnPoint(s,a.id,'start');assert(!ar.active);assert(s.combatPlus.reminders.some(r=>r.title.includes('expiry')));
 const ar2=area(s,shape,{concentration:'Web'});s.combat.tokens[a.id].concentration='Web';api.syncAreas(s);assert(ar2.active);s.combat.tokens[a.id].concentration='Darkness';api.syncAreas(s);assert(!ar2.active);
 const ar3=area(s,shape,{active:false}),e={id:api.id(),scene:s.scene,name:'Boss retreat',kind:'Boss phase',boss:b.id,areas:[ar3.id],reveal:[a.id],note:'Secret boss plan',repeatable:false};s.combatPlus.events.push(e);a.visible=false;api.trigger(s,e.id);assert(a.visible&&ar3.active);assert.equal(s.combatPlus.phases[b.id],'Boss retreat');assert.throws(()=>api.trigger(s,e.id),/already/);
 __plus.set(s);const restored=__plus.normalize(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.combatPlus,s.combatPlus);const tv=JSON.stringify(__plus.publicState()),phone=JSON.stringify(__plus.phoneSnapshot());assert(!tv.includes('Secret boss plan')&&!phone.includes('Secret boss plan'));assert(!tv.includes('Secret effect instructions')&&!phone.includes('Secret effect instructions'));
 ar3.public=true;assert(__plus.publicState().annotations.some(a=>a.id===ar3.id));assert(!Object.hasOwn(__plus.publicState(),'combatPlus'));
}
{
 const {s,a,b}=fresh();a.conditions=['Poisoned'];b.conditions=['Restrained'];let g=api.suggest(s,a.id,b.id);assert.equal(g.mode,'normal');assert(g.yes.length&&g.no.length);a.conditions=[];assert.equal(api.suggest(s,a.id,b.id).mode,'advantage');b.conditions=['Prone'];assert.equal(api.suggest(s,a.id,b.id,'attack','',15).mode,'disadvantage');assert.equal(api.suggest(s,a.id,b.id,'attack','',5).mode,'advantage');assert.equal(api.suggest(s,b.id,'','save','dex').mode,'normal');b.conditions=['Restrained'];assert.equal(api.suggest(s,b.id,'','save','dex').mode,'disadvantage');
}
// Held phone attack rolls are stable across reaction changes and re-preview.
{
 const {s,a,b}=fresh();s.party[a.id].attacks=[{name:'Hammer',type:'Action',attackBonus:5,damageDice:'1d8+3',damageType:'bludgeoning',effect:'Attack'}];const entry=ECHO_PARTY_DATA.ownerView(s.party[a.id]).attacks[0],r=ECHO_PHONE_ACTIONS.receive(s,{kind:'action-request',requestId:'held',characterId:a.id,scene:s.scene,actionType:'attack',actionIndex:0,actionName:entry.name,entry,targetIds:[b.id]},[a.id,b.id]);const p=ECHO_PHONE_ACTIONS.initialPlan(s,r);p.acknowledged=true;let calls=0;const cache={},ctx={visible:[a.id,b.id],die:sides=>{calls++;return 4;},saveBonus:()=>0,cache};const first=ECHO_PHONE_ACTIONS.prepare(s,r,p,ctx);b.ac+=5;const second=ECHO_PHONE_ACTIONS.prepare(s,r,p,ctx);assert.equal(calls,2);assert.equal(first.rolls[0].id,second.rolls[0].id);
 const pause=api.pause(s,{label:'React',targets:[b.id]});assert.throws(()=>ECHO_PHONE_ACTIONS.prepare(s,r,p,ctx),/reaction window/);pause.status='closed';assert.doesNotThrow(()=>ECHO_PHONE_ACTIONS.prepare(s,r,p,ctx));
}
console.log('Combat plus passed: path costs/crawling/difficult terrain, opportunity pauses, multi-owner saves, revisions/privacy, component defenses, Shield expiry, held rolls, damage atomicity, spell entry/turn/expiry triggers, boss events, condition guidance, persistence, and TV/phone projections.');
// Exercise actual DM controls, including staged damage and its single application.
class Element{constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.value='';this.text='';this.classList={add(){},toggle(){}};}set textContent(v){this.text=String(v);}get textContent(){return this.text;}append(...c){this.children.push(...c);}replaceChildren(...c){this.children=c;}addEventListener(e,f){this.listeners[e]=f;}setAttribute(){} }
global.document={createElement:t=>new Element(t)};require(path.join(root,'Session-01-Combat-Plus-UI.js'));
{
 let {s,a,b}=fresh(),dom=new Element('div'),commits=0,warning='';const ui=ECHO_COMBAT_PLUS_UI,flatten=n=>[n,...n.children.flatMap(flatten)];
 ui.init({state:()=>s,replace:v=>s=v,root:()=>dom,show(){},columns:()=>20,commit:()=>{commits++;ui.render();},toast:m=>warning=m,die:()=>10,saveBonus:()=>2,tool(){},announce(){}});
 const press=text=>{const b=flatten(dom).find(n=>n.tagName==='button'&&n.textContent===text);assert(b,text);b.listeners.click();};
 const field=(label,value,check=false)=>{const l=flatten(dom).find(n=>n.tagName==='label'&&(n.textContent===label||n.children.some(c=>c.textContent===label)));assert(l,label);const i=l.children.find(n=>['input','select','textarea'].includes(n.tagName));if(check)i.checked=value;else i.value=value;i.listeners.change();};
 ui.stageDamage({targets:[b.id],components:[{amount:5,type:'fire',magical:true,overrides:{}}]});field('Reactions have been resolved or passed',true,true);press('Preview component damage');const count=commits;press('Apply reviewed damage');assert.equal(commits,count+1);assert.equal(s.tokens.find(t=>t.id===b.id).hp,25);
 ui.open('saves');field(a.name,true,true);press('Send saving throws');assert.equal(s.combatPlus.saves.length,1);press('Roll for player');assert.equal(s.combatPlus.saves[0].targets[0].status,'failed');
 s.annotations.push({id:'shape-test',scene:s.scene,...shape});ui.open('areas');field('Drawn template','shape-test');field('Owner / duration anchor',a.id);field('Difficult terrain',true,true);press('Keep this spell area');assert.equal(s.combatPlus.areas.length,1);assert.equal(s.annotations.length,0);
 ui.open('events');field('Event / phase name','Rising sparks');field('DM instructions / changed tactics','Sparks illuminate the forge.');press('Save event');assert.equal(s.combatPlus.events.length,1);press('Trigger event');assert(s.combatPlus.events[0].done);
 ui.open('movement');assert(!flatten(dom).some(n=>n.tagName==='button'&&n.textContent==='Plan movement on map'),'Movement planner is absent from the live combat tools');assert.equal(warning,'');
 console.log('Combat tools UI passed: saves, damage preview/apply, template conversion, encounter events, and no movement planner.');
}
// Large-map smoke check: 250 tokens and many overlapping terrain areas.
{
 const {s,a,enemy}=fresh();for(let i=0;i<247;i++){const t={...clone(enemy),id:`many-${i}`,x:i%100,y:(i*7)%100};s.tokens.push(t);}
 for(let i=0;i<50;i++)area(s,{kind:'square',x1:i,y1:10,x2:i+10,y2:70},{public:i%2===0});
 const start=performance.now(),preview=api.movementPreview(s,a.id,[{x:a.x,y:a.y},{x:50,y:50},{x:80,y:50}]);const ms=performance.now()-start;assert(Number.isFinite(preview.cost));assert(ms<2000,`Movement preview took ${ms}ms`);console.log(`Large-map movement preview: ${Math.round(ms)}ms for ${s.tokens.length} tokens and 50 areas.`);
}

const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const f of ['Session-01-Party-Data.js','Session-01-Combat-Data.js','Session-01-Combat-Run.js','Session-01-Combat-Plus.js','Session-01-Phone-Actions.js','Session-01-Combat-Actions.js','Session-01-Commands.js'])require(path.join(root,f));
global.ECHO_PHONE_ACTION_CONDITIONS=['Prone','Poisoned','Concentrating','Unconscious'];
const A=ECHO_COMBAT_ACTIONS,P=ECHO_PHONE_ACTIONS,C=ECHO_COMMANDS,clone=structuredClone;
function fresh(){
 const hero={id:'hero',name:'Hero',team:'pc',type:'pc',hp:20,maxHp:20,tempHp:0,ac:15,conditions:[],placed:true,visible:true,scene:'map',x:20,y:20};
 const foe={...clone(hero),id:'foe',name:'Foe',team:'enemy',type:'redbrand-ruffian',hp:30,maxHp:30,tempHp:3,ac:13};
 const sheet=ECHO_PARTY_DATA.normalizeSheet({id:'hero',name:'Hero',level:4,abilities:{str:16,dex:12,con:14,int:10,wis:10,cha:10},hp:20,maxHp:20,attacks:[{name:'Hammer',type:'Action',attackBonus:5,damageDice:'1d8+3',damageType:'bludgeoning',effect:'Attack one target.',resourceId:'charge',cost:1}],resources:[{id:'charge',name:'Charges',current:2,max:2}],features:[],actions:[],spells:[]});
 return {commandRevision:7,scene:'map',tokens:[hero,foe],party:{hero:sheet},phoneActions:P.normalize(),phoneReplies:{},rolls:[],combat:{tokens:{hero:{concentration:''},foe:{concentration:'Private spell',resistances:'bludgeoning'}},creatures:{},effects:[]},combatRun:{queue:{key:'map:1:hero',actionUsed:false,bonusUsed:false,done:[],movementUsed:0},resources:{}},combatPlus:ECHO_COMBAT_PLUS.normalize(),turn:{scene:'map',round:1,index:0,order:['hero','foe']}};
}
function request(s,source='phone'){
 if(source==='dm')return A.stage(s,{actorId:'hero',actionType:'attack',actionIndex:0,targetIds:['foe']});
 const entry=ECHO_PARTY_DATA.ownerView(s.party.hero).attacks[0];return P.receive(s,{kind:'action-request',requestId:'phone-test',characterId:'hero',scene:'map',actionType:'attack',actionIndex:0,actionName:entry.name,entry,targetIds:['foe'],source:'dm',custom:true},['hero','foe']);
}
function prepare(s,r,adjust=()=>{},cache={}){const p=P.initialPlan(s,r);p.acknowledged=true;p.reactionsChecked=true;adjust(p);return A.prepare(s,r,p,{visible:['hero','foe'],die:sides=>sides===20?12:6,saveBonus:()=>2,cache});}
function resolve(s,review){const command=C.prepare(s,{type:'resolve-combat-action',review,expectedRevision:review.baseRevision},{visible:['hero','foe']});return C.apply(s,command);}
test('DM and phone intents produce identical patches, outcomes and roll values in one command',()=>{
 const dm=fresh(),ph=fresh(),dr=request(dm,'dm'),pr=request(ph);assert.equal(pr.source,'phone','Phone cannot forge a DM intent');
 const d=prepare(dm,dr),p=prepare(ph,pr);assert.deepEqual(d.patches,p.patches);assert.deepEqual(d.outcomes,p.outcomes);assert.deepEqual(d.rolls.map(r=>r.total),p.rolls.map(r=>r.total));
 const result=resolve(dm,d);assert.equal(result.party.hero.resources[0].current,1);assert.equal(result.tokens[1].hp,29);assert.equal(result.tokens[1].tempHp,0);assert(result.combatRun.queue.actionUsed);assert.equal(result.phoneActions.requests[0].status,'resolved');
 const undo=A.undo(result,dr.id);assert.deepEqual(undo.tokens,dm.tokens);assert.deepEqual(undo.party,dm.party);assert.deepEqual(undo.combatRun.queue,dm.combatRun.queue);assert.equal(undo.rolls.length,0);
 assert.throws(()=>resolve(result,d),/no longer|changed/);
});
test('physical attack natural die, critical damage and physical concentration are reviewed together',()=>{
 const s=fresh(),r=request(s);const rev=prepare(s,r,p=>Object.assign(p.steps[0],{attackMethod:'physical',attackTotal:25,natural:20,manual:'18',concentrationMethod:'physical',concentrationTotal:'4',condition:'Prone',conditionWhen:'hit'}));
 assert.equal(rev.rolls[0].kind,'physical');assert.equal(rev.rolls.length,2,'No hidden digital damage roll when physical damage supplied');assert.equal(rev.patches.find(p=>p.kind==='token'&&p.id==='foe'&&p.field==='hp').after,24);
 const next=resolve(s,rev);assert.equal(next.combat.tokens.foe.concentration,'');assert(next.tokens[1].conditions.includes('Prone'));assert.equal(A.undo(next,r.id).combat.tokens.foe.concentration,'Private spell');
 assert.throws(()=>prepare(s,r,p=>Object.assign(p.steps[0],{attackMethod:'physical',attackTotal:25,natural:''})),/natural attack/);
});
test('physical damage respects misses, natural 1, saves and component defenses',()=>{
 const s=fresh(),r=request(s);let rev=prepare(s,r,p=>Object.assign(p.steps[0],{attackMethod:'physical',attackTotal:99,natural:1,manual:30}));assert(!rev.patches.some(p=>p.kind==='token'&&p.field==='hp'));
 rev=prepare(s,r,p=>Object.assign(p.steps[0],{kind:'save',saveAbility:'DEX',dc:13,saveMethod:'physical',saveTotal:20,success:'half',manual:10}));assert(!rev.patches.some(p=>p.field==='hp'&&p.kind==='token'));assert.equal(rev.patches.find(p=>p.field==='tempHp'&&p.kind==='token').after,1);
});
test('components aggregate one concentration DC per damage event; deferred saves create undoable reminders',()=>{
 const s=fresh(),r=request(s);const rev=prepare(s,r,p=>{p.steps[0].components=[{manual:20,type:'bludgeoning'},{manual:12,type:'fire',magical:true}];p.steps[0].concentrationMethod='reminder';p.reminders=[{tokenId:'foe',triggerActor:'hero',triggerPoint:'end',remaining:1,name:'Repeat poison save',note:'DM ruling',repeatSave:true}];});
 assert.equal(rev.effects.length,2);assert.match(rev.effects[0].name,/DC 11/);assert.equal(rev.rolls.length,1);const n=resolve(s,rev);assert.equal(n.combat.effects.length,2);assert.equal(A.undo(n,r.id).combat.effects.length,0);
});
test('conditional defenses and unknown damage types demand explicit rulings; failed preview spends nothing',()=>{
 const s=fresh(),r=request(s),before=clone(s);s.combat.tokens.foe.resistances='bludgeoning while guarding a door';
 assert.throws(()=>prepare(s,r),/clarify conditional/);assert.equal(s.party.hero.resources[0].current,2);
 assert.doesNotThrow(()=>prepare(s,r,p=>p.steps[0].overrides={foe:'none'}));
 assert.throws(()=>prepare(s,r,p=>p.steps[0].damageType='unusual'),/actual damage type/);
 assert.deepEqual(before.party,s.party);
});
test('reaction boundary blocks resolve, retains dice, then recomputes AC after Shield',()=>{
 const s=fresh(),r=request(s),cache={};let rev=prepare(s,r,p=>p.reactionsChecked=false,cache);assert.throws(()=>resolve(s,rev),/Confirm reactions/);
 const pause=ECHO_COMBAT_PLUS.pause(s,{label:'Shield',targets:['hero']});assert.throws(()=>prepare(s,r,()=>{},cache),/reaction window/);
 pause.status='closed';s.tokens[1].ac=25;const next=prepare(s,r,()=>{},cache);assert.equal(next.rolls[0].id,rev.rolls[0].id);assert.match(next.outcomes[0].text,/miss/);assert(!next.patches.some(p=>p.kind==='token'&&p.field==='hp'));
});
test('revision changes and defense changes invalidate preview before any costs or HP commit',()=>{
 const s=fresh(),r=request(s),review=prepare(s,r);s.commandRevision++;assert.throws(()=>resolve(s,review),/changed/);assert.equal(s.party.hero.resources[0].current,2);
 s.commandRevision--;s.combatPlus.defenses.foe=[{type:'fire',kind:'immunities',when:'always'}];assert.throws(()=>resolve(s,review),/changed/);
});
test('NPC multiattack uses the same engine and marks only the selected sequence step',()=>{
 const s=fresh();s.turn.index=1;s.combatRun.queue={key:'map:1:foe',actionUsed:false,bonusUsed:false,movementUsed:0,done:[false,false]};
 const r=A.stage(s,{actorId:'foe',actionType:'attack',actionIndex:0,targetIds:['hero'],sequenceStep:0}),first=resolve(s,prepare(s,r));assert(first.combatRun.queue.done[0]);assert(!first.combatRun.queue.done[1]);
 const second=A.stage(first,{actorId:'foe',actionType:'attack',actionIndex:0,targetIds:['hero'],sequenceStep:1});const next=resolve(first,prepare(first,second));assert.deepEqual(next.combatRun.queue.done,[true,true]);assert.deepEqual(P.publicRequests(next,'hero'),[]);assert(next.rolls.every(r=>!r.public));
 assert.throws(()=>prepare(next,A.stage(next,{actorId:'foe',actionType:'attack',actionIndex:0,targetIds:['hero'],sequenceStep:1})),/already used/);
});
test('legacy staged damage enters the common engine, including physical saves, undo and resource-free events',()=>{
 const s=fresh(),job={id:'damage-job',scene:'map',status:'staged',label:'Falling rocks',targets:['hero'],components:[{amount:6,type:'bludgeoning'}],reactionsChecked:true};s.combatPlus.damage.push(job);
 const {request:r,plan}=A.fromDamage(s,job);assert.equal(plan.usage,'none');plan.acknowledged=true;const review=A.prepare(s,r,plan,{visible:['hero','foe'],die:()=>4,saveBonus:()=>0});const n=resolve(s,review);assert.equal(n.tokens[0].hp,14);assert.equal(n.party.hero.resources[0].current,2);assert.equal(n.combatPlus.damage[0].status,'resolved');assert.equal(A.undo(n,r.id).combatPlus.damage[0].status,'staged');
});
test('owner receipt excludes private defenses, concentration, patch values and DM-initiated history',()=>{
 const s=fresh(),r=request(s),next=resolve(s,prepare(s,r)),publicText=JSON.stringify(P.publicRequests(next,'hero'));for(const secret of ['Private spell','concentration DC','resistances','patches','signature'])assert(!publicText.includes(secret),secret);
 const d=A.stage(next,{actorId:'hero',actionType:'action',entry:{name:'Secret DM ruling',type:'No action',effect:'Secret'},targetIds:[]});assert(!JSON.stringify(P.publicRequests(next,'hero')).includes(d.label));const reviewed=prepare(next,d,p=>p.override='Private manual narrative only.');const done=resolve(next,reviewed);assert(!JSON.stringify(done.phoneReplies).includes(d.label));assert.throws(()=>P.receive(next,{kind:'action-cancel',requestId:d.id,characterId:'hero',expectedRevision:d.revision},['hero']),/controlled by the DM/);
});
test('Shield is one reversible resolution including slot, reaction, AC and next-turn expiry',()=>{
 const run=source=>{const s=fresh();s.party.hero.actions=[{name:'Shield',type:'Reaction',resourceId:'slot',cost:1,effect:'+5 AC until next turn start.'}];s.party.hero.resources=[{id:'slot',name:'Level 1 spell slots',current:2,max:2}];const entry=ECHO_PARTY_DATA.ownerView(s.party.hero).actions[0];
 const r=source==='dm'?A.stage(s,{actorId:'hero',actionType:'action',actionIndex:0,targetIds:[]}):P.receive(s,{kind:'action-request',requestId:'shield-phone',characterId:'hero',scene:s.scene,actionType:'action',actionIndex:0,actionName:entry.name,entry,targetIds:[],note:'Cast Shield'},['hero','foe']);
 const review=prepare(s,r),next=resolve(s,review);assert.equal(next.tokens[0].ac,20);assert.equal(next.party.hero.ac,20);assert.equal(next.party.hero.resources[0].current,1);assert(next.combat.tokens.hero.reactionUsed);assert.equal(next.combatPlus.acEffects.filter(e=>e.active).length,1);
 const undo=A.undo(next,r.id);assert.equal(undo.tokens[0].ac,15);assert.equal(undo.party.hero.resources[0].current,2);assert.equal(undo.combatPlus.acEffects.length,0);assert(!undo.combat.tokens.hero.reactionUsed);
 ECHO_COMBAT_PLUS.turnPoint(next,'hero','start');assert.equal(next.tokens[0].ac,15);assert.equal(next.party.hero.ac,15);return review.patches.filter(p=>p.kind!=='plus');};assert.deepEqual(run('dm'),run('phone'));
});
test('effect-only actions require a written ruling and never infer effects from prose',()=>{
 const s=fresh(),r=A.stage(s,{actorId:'hero',actionType:'action',entry:{name:'Unusual ritual',type:'No action',effect:'Turn every creature into glass.'},targetIds:[]});assert.throws(()=>prepare(s,r),/DM ruling/);const review=prepare(s,r,p=>p.override='Appearance only, no mechanical effect; discuss with the table.');assert.equal(review.patches.length,0);assert.equal(review.effects.length,0);assert.equal(review.rolls.length,0);
});

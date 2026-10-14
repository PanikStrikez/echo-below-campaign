const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const f of ['Session-01-Party-Data.js','Session-01-Character-Tools.js','Session-01-Party-Actions.js','Session-01-Combat-Data.js','Session-01-Combat-Run.js','Session-01-Combat-Plus.js','Session-01-Phone-Actions.js','Session-01-Combat-Actions.js','Session-01-Commands.js'])require(path.join(root,f));
global.ECHO_PHONE_ACTION_CONDITIONS=['Prone','Poisoned','Concentrating','Unconscious'];
const M=ECHO_PARTY_DATA,P=ECHO_PHONE_ACTIONS,A=ECHO_COMBAT_ACTIONS,copy=structuredClone;
function fresh(id){
 const party=M.seedParty();for(const key of ['pc-trista','pc-pebble'])party[key]=M.normalizeSheet(M.levelFourSheet(M.levelThreeSheet(party[key])),party[key]);party['pc-ringgo']=M.normalizeSheet(M.levelFourSheet(party['pc-ringgo']),party['pc-ringgo']);
 const tokens=Object.values(party).filter(sh=>sh.id.startsWith('pc-')).map(sh=>({id:sh.id,name:sh.name,team:'pc',type:'pc',hp:sh.maxHp,maxHp:sh.maxHp,tempHp:0,ac:sh.ac,conditions:[],placed:true,visible:true,scene:'map'}));
 tokens.push({id:'foe',name:'Target',team:'enemy',type:'goblin',hp:100,maxHp:100,tempHp:0,ac:10,conditions:[],placed:true,visible:true,scene:'map'});
 return {commandRevision:1,scene:'map',tokens,party,phoneActions:P.normalize(),phoneReplies:{},rolls:[],combat:{tokens:{},creatures:{},effects:[]},combatPlus:ECHO_COMBAT_PLUS.normalize(),combatRun:ECHO_COMBAT_RUN.normalize(),turn:{scene:'map',round:1,index:0,order:[id,'foe']}};
}
function intent(s,id,name,field='action',source='dm',targets=['foe']){const entries=M.ownerView(s.party[id])[{attack:'attacks',action:'actions',spell:'spells'}[field]],index=entries.findIndex(a=>a.name===name);assert(index>=0,name);if(source==='dm')return A.stage(s,{actorId:id,actionType:field,actionIndex:index,targetIds:targets});const a=entries[index];return P.receive(s,{kind:'action-request',requestId:'ph-'+name,characterId:id,scene:'map',actionType:field,actionIndex:index,actionName:a.name,entry:a,targetIds:targets},s.tokens.map(t=>t.id));}
function preview(s,r,adjust=()=>{},die=side=>side===20?12:2){const p=P.initialPlan(s,r);p.acknowledged=p.reactionsChecked=true;adjust(p);return P.prepare(s,r,p,{visible:s.tokens.map(t=>t.id),die,saveBonus:()=>0,cache:{}});}
const resolve=(s,v)=>P.apply(s,v,s.tokens.map(t=>t.id));
test('card audit classifies every card without changing a character or adding spells; source labels and owner privacy survive',()=>{
 const s=fresh('pc-trista'),before=copy(s.party),rows=ECHO_PARTY_ACTIONS.audit(s);assert.equal(rows.length,5);assert.deepEqual(s.party,before);for(const row of rows)for(const c of row.cards){assert(['supported','choice','reference'].includes(c.status));assert(c.source.book);assert(c.reason);}
 assert.equal(s.party['pc-donavan'].level,3);assert.equal(s.party['pc-aldric'].level,3);assert.equal(s.party['pc-trista'].level,4);
 s.party['pc-aldric'].notes='DM secret';assert(!JSON.stringify(M.ownerView(s.party['pc-aldric'])).includes('DM secret'));assert(!M.safeView(s.party['pc-aldric']).attacks.some(a=>a.support));
 const don=M.ownerView(s.party['pc-donavan']);assert(don.actions.some(a=>a.derived&&a.name==='Guiding Bolt'));assert(!don.spells.some(a=>a.name==='Mind Sliver'));assert.equal(don.actions.find(a=>a.name==='Guiding Bolt').attackBonus,5);
});
test('Flurry creates two independent attacks but spends one Focus and one bonus action, equally from phone or DM; undo restores all',()=>{
 const runs=[];for(const source of ['dm','phone']){const s=fresh('pc-trista'),r=intent(s,'pc-trista','Flurry of Blows','action',source),v=preview(s,r);assert.equal(v.plan.steps.length,2);const n=resolve(s,v);assert.equal(n.tokens.find(t=>t.id==='foe').hp,88);assert.equal(n.party['pc-trista'].resources.find(x=>x.id==='trista-focus').current,3);assert(n.combatRun.queue.bonusUsed);assert.deepEqual(P.undo(n,r.id).party,s.party);runs.push(v.patches);}assert.deepEqual(runs[0],runs[1]);
 const s=fresh('pc-trista'),r=intent(s,'pc-trista','Flurry of Blows');assert.throws(()=>preview(s,r,p=>p.steps.pop()),/exactly 2/);
});
test('2024 Focus variants, Uncanny healing/restoration and initiative confirmation are atomic',()=>{
 const s=fresh('pc-trista');s.party['pc-trista'].resources.find(x=>x.id==='trista-focus').current=1;s.party['pc-trista'].hp=s.tokens.find(t=>t.id==='pc-trista').hp=12;
 const r=intent(s,'pc-trista','Uncanny Metabolism','action','dm',[]);assert.throws(()=>preview(s,r),/initiative/);const n=resolve(s,preview(s,r,p=>p.partyCard.choices.initiativeConfirmed=true));assert.equal(n.party['pc-trista'].hp,18);assert.equal(n.party['pc-trista'].resources.find(x=>x.id==='trista-focus').current,4);assert.equal(n.party['pc-trista'].resources.find(x=>x.id==='trista-uncanny').current,0);assert.deepEqual(P.undo(n,r.id).party,s.party);
 const free=fresh('pc-trista'),fr=intent(free,'pc-trista','Patient Defense','action','dm',[]),fn=resolve(free,preview(free,fr));assert.equal(fn.party['pc-trista'].resources.find(x=>x.id==='trista-focus').current,4);assert(fn.combat.effects.some(x=>x.name==='Patient Defense'));assert(fn.combatRun.queue.bonusUsed);
});
test('Champion critical threshold, Second Wind and Action Surge use approved Fighter choices',()=>{
 const s=fresh('pc-pebble'),r=intent(s,'pc-pebble','Warhammer','attack');const v=preview(s,r,()=>{},side=>side===20?19:2);assert.match(v.outcomes[0].text,/critical/);assert.equal(v.rolls[1].notation,'2d8+4');
 const w=fresh('pc-pebble');w.party['pc-pebble'].hp=w.tokens.find(t=>t.id==='pc-pebble').hp=10;const wr=intent(w,'pc-pebble','Second Wind','action','dm',[]),wn=resolve(w,preview(w,wr));assert.equal(wn.party['pc-pebble'].hp,16);assert.equal(wn.party['pc-pebble'].resources[0].current,0);
 const b=fresh('pc-pebble');b.combatRun.queue.key='map:1:pc-pebble';b.combatRun.queue.actionUsed=true;const br=intent(b,'pc-pebble','Action Surge','action','dm',[]),bn=resolve(b,preview(b,br));assert(!bn.combatRun.queue.actionUsed);assert.equal(bn.party['pc-pebble'].resources.find(x=>x.id==='pebble-action-surge').current,0);
});
test('Magic Missile allocates every upcast dart with shared damage; target omissions and Shield confirmation block without spending',()=>{
 const s=fresh('pc-aldric'),r=intent(s,'pc-aldric','Magic Missile');assert.throws(()=>preview(s,r),/Confirm.*dart/);const v=preview(s,r,p=>{p.costs=[{id:'aldric-slots-2',delta:-1}];p.partyCard.choices={dartTargets:['foe','foe','foe','foe'],missileConfirmed:true};});assert.equal(v.plan.steps.length,4);assert.equal(v.rolls.filter(x=>x.notation==='1d4+1').length,1);const n=resolve(s,v);assert.equal(n.tokens.find(t=>t.id==='foe').hp,88);assert.equal(n.party['pc-aldric'].resources[0].current,4);assert.equal(n.party['pc-aldric'].resources[1].current,1);assert.deepEqual(P.undo(n,r.id).party,s.party);
 assert.throws(()=>preview(s,r,p=>{p.partyCard.choices.missileConfirmed=true;p.partyCard.choices.dartTargets=['foe'];}),/Allocate all/);
});
test('Ice Knife burst occurs after a miss and uses one slot; Scorcher’s explicit Sculpt exclusions take no damage',()=>{
 const s=fresh('pc-aldric'),r=intent(s,'pc-aldric','Ice Knife'),v=preview(s,r,p=>{Object.assign(p.steps[0],{attackMethod:'physical',attackTotal:7,natural:1});p.partyCard.choices={burstTargets:['foe'],burstConfirmed:true};});assert.equal(v.plan.steps[0].damageType,'piercing');assert.equal(v.plan.steps[1].damageType,'cold');assert.equal(resolve(s,v).tokens.find(t=>t.id==='foe').hp,96);assert.equal(v.plan.costs.length,1);
 const b=fresh('pc-aldric'),br=intent(b,'pc-aldric','Aganazzar’s Scorcher','action','dm',['foe','pc-pebble']),bv=preview(b,br,p=>p.partyCard.choices={protectedTargets:['pc-pebble'],sculptConfirmed:true});const n=resolve(b,bv);assert.equal(n.tokens.find(t=>t.id==='pc-pebble').hp,b.tokens.find(t=>t.id==='pc-pebble').hp);assert.equal(n.tokens.find(t=>t.id==='foe').hp,94);
});
test('multiclass spell DC, healing/upcasting and Arcane Recovery use wizard level, not total level',()=>{
 const s=fresh('pc-donavan'),t=s.tokens.find(t=>t.id==='foe');t.hp=99;const r=intent(s,'pc-donavan','Toll the Dead'),v=preview(s,r);assert.equal(v.plan.steps[0].notation,'1d12');assert.equal(v.plan.steps[0].dc,13);assert.equal(v.plan.costs.length,0);
 const heal=intent(s,'pc-donavan','Healing Word','action','dm',['pc-pebble']),hv=preview(s,heal,p=>p.costs=[{id:'donavan-slots-2',delta:-1}]);assert.equal(hv.plan.steps[0].notation,'2d4+3');
 const unarmed=intent(s,'pc-donavan','Unarmed Strike','attack'),uv=preview(s,unarmed);assert.equal(uv.rolls.find(x=>x.kind==='fixed').total,2);
 const rest=fresh('pc-donavan');rest.turn.order=[];rest.party['pc-donavan'].resources.find(x=>x.id==='donavan-slots-1').current=1;const rr=intent(rest,'pc-donavan','Arcane Recovery','action','dm',[]);const rv=preview(rest,rr,p=>p.partyCard.choices={restConfirmed:true,recovery:{'donavan-slots-1':1}});assert.equal(resolve(rest,rv).party['pc-donavan'].resources[0].current,2);assert.throws(()=>preview(rest,rr,p=>p.partyCard.choices={restConfirmed:true,recovery:{'donavan-slots-2':1}}),/combined slot/);
});
test('Sneak Attack, arrows, 2014 Assassinate and Piercer are one resolution, once per turn with undo and off-turn reuse',()=>{
 const s=fresh('pc-ringgo'),r=intent(s,'pc-ringgo','Shortbow','attack');const choose=p=>Object.assign(p.partyCard.choices,{sneak:true,qualifies:true,targetNotActed:true,surprised:true,piercerIndex:'0'});const v=preview(s,r,choose);assert.match(v.outcomes[0].text,/critical/);assert(v.rolls.some(x=>x.notation==='4d6'));assert(v.rolls.some(x=>x.label.includes('extra weapon critical')));const n=resolve(s,v);assert.equal(n.party['pc-ringgo'].resources[0].current,19);assert(v.plan.partyCard.usedSneak);assert(v.plan.partyCard.usedPiercer);assert.deepEqual(P.undo(n,r.id).party,s.party);
 const another=intent(n,'pc-ringgo','Dagger','attack');assert.throws(()=>preview(n,another,p=>{p.usage='reaction';Object.assign(p.partyCard.choices,{sneak:true,qualifies:true});}),/already used this turn/);
 n.turn.index=1;const next=intent(n,'pc-ringgo','Dagger','attack');assert.doesNotThrow(()=>preview(n,next,p=>{p.usage='reaction';Object.assign(p.partyCard.choices,{sneak:true,qualifies:true});}));
 const bad=fresh('pc-ringgo'),badR=intent(bad,'pc-ringgo','Dagger','attack');assert.throws(()=>preview(bad,badR,p=>{p.steps[0].mode='disadvantage';Object.assign(p.partyCard.choices,{sneak:true,qualifies:true});}),/disadvantage/);
});
test('reference-only effects, Goron powers and hidden targets remain explicit rulings; no automatic state or secret exposure',()=>{
 const s=fresh('pc-pebble');M.applyGoronTraits(s);const r=intent(s,'pc-pebble','Rock Eater','action','dm',[]),before=copy(s);assert.throws(()=>preview(s,r),/DM ruling/);assert.deepEqual(s,before);
 const a=fresh('pc-aldric'),ar=intent(a,'pc-aldric','Magic Missile');const p=P.initialPlan(a,ar);p.acknowledged=p.reactionsChecked=true;p.partyCard.choices={dartTargets:['foe','secret','foe'],missileConfirmed:true};assert.throws(()=>P.prepare(a,ar,p,{visible:['foe'],die:()=>2,saveBonus:()=>0}),/hidden|unavailable/);
});
test('edited spell dice and foreign features stay manual; the 2014 bonus-action spell limit blocks invalid combinations',()=>{
 const edited=fresh('pc-aldric');edited.party['pc-aldric'].actions.find(x=>x.name==='Magic Missile').damageDice='5d10';const card=M.ownerView(edited.party['pc-aldric']).actions.find(x=>x.name==='Magic Missile');assert.equal(card.support.status,'reference');assert.equal(card.damageDice,'5d10');assert.throws(()=>preview(edited,intent(edited,'pc-aldric','Magic Missile')),/DM ruling/);
 const sh=edited.party['pc-pebble'];sh.actions.push({id:'custom-flurry',name:'Flurry of Blows',type:'Bonus action',damageDice:'1d8+4',effect:'Unapproved custom ability.'});assert.equal(M.ownerView(sh).actions.at(-1).support.status,'reference');
 const s=fresh('pc-donavan'),r=intent(s,'pc-donavan','Healing Word','action','dm',['pc-pebble']),n=resolve(s,preview(s,r));const next=intent(n,'pc-donavan','Magic Missile');assert.throws(()=>preview(n,next,p=>p.partyCard.choices.missileConfirmed=true),/bonus-action spell restriction/);
 assert.doesNotThrow(()=>preview(n,intent(n,'pc-donavan','Ray of Frost','attack')));
});
test('saved pending intents remain usable when only support labels are added, while edited mechanics still invalidate them',()=>{
 const s=fresh('pc-pebble'),r=intent(s,'pc-pebble','Warhammer','attack','phone');delete r.entry.support;assert.doesNotThrow(()=>preview(s,r));
 s.party['pc-pebble'].attacks[0].attackBonus=99;assert.throws(()=>preview(s,r),/action changed/);
});

test('Sneak Attack scales with rogue levels in DM and phone reviews, previews and critical dice; no sheet rewrite',()=>{
 for(const [level,className,dice]of [[3,'Rogue 3',2],[5,'Rogue 5',3],[7,'Rogue 7',4],[7,'Rogue 6 / Wizard 1',3]])for(const source of ['dm','phone']){
  const s=fresh('pc-ringgo'),sh=s.party['pc-ringgo'];sh.level=level;sh.className=className;const before=copy(sh),r=intent(s,'pc-ringgo','Shortbow','attack',source);
  const v=preview(s,r,p=>{p.partyCard.choices.sneak=true;p.partyCard.choices.qualifies=true;p.steps[0].attackMethod='physical';p.steps[0].attackTotal=28;p.steps[0].natural=20;});
  assert.equal(v.plan.steps[0].components.find(c=>c.sneak).notation,`${dice}d6`);
  assert(v.rolls.some(x=>x.notation===`${dice*2}d6`),'critical doubles the correct Sneak dice');
  assert.deepEqual(sh,before,'preview changes no character statistics');const after=resolve(s,v);assert.deepEqual(P.undo(after,r.id).party,s.party);
  assert.equal(M.ownerView(sh).equipment.find(x=>/arrows/i.test(x.name)).quantity,sh.resources.find(x=>/arrows/i.test(x.name)).current);
 }
});
test('effect-only saving throws report their condition without false healing or HP changes',()=>{
 const s=fresh('pc-aldric'),r=A.stage(s,{actorId:'pc-aldric',entry:{name:'Web ruling',type:'Action',saveAbility:'DEX',saveDC:16,effect:'Restrained if failed'},targetIds:['foe']});
 const v=preview(s,r,p=>{p.override='DM-reviewed effect-only saving throw';p.steps[0].kind='save';p.steps[0].notation='';p.steps[0].manual='';p.steps[0].condition='Prone';p.steps[0].conditionWhen='hit';});
 assert(!v.outcomes.some(x=>/healing|temp HP absorbed/.test(x.text)));assert.equal(resolve(s,v).tokens.find(x=>x.id==='foe').hp,100);
});
test('display-only freeform request uses canonical phone review and requires a ruling without spending anything',()=>{const s=fresh('pc-trista'),before=JSON.stringify(s.party['pc-trista']),r=intent(s,'pc-trista','Describe another action','action','phone',['foe']);assert.equal(r.status,'waiting');const plan=P.initialPlan(s,r);assert(plan.effectRulingRequired);assert.equal(plan.usage,'none');assert.equal(plan.costs.length,0);assert.equal(JSON.stringify(s.party['pc-trista']),before);});

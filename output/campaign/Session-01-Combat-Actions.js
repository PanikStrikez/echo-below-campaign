/* DM adapters for the shared action engine. Never loaded on TVs or phones. */
(() => {
 'use strict';
 const copy=structuredClone,api=()=>globalThis.ECHO_PHONE_ACTIONS;
 const token=(s,id)=>s.tokens.find(t=>t.id===id);
 const fields={attack:'attacks',action:'actions',spell:'spells',resource:'resources'};
 function actorView(s,id){
  if(s.party[id])return globalThis.ECHO_PARTY_DATA.ownerView(s.party[id]);
  const t=token(s,id);if(!t)throw Error('Choose a combatant.');
  const creature=globalThis.ECHO_COMBAT_DATA.CREATURES[t.type]||s.combat.creatures[t.type];
  const converted=(a,source)=>{const dice=globalThis.ECHO_COMBAT_RUN.damageDice(a.dice);return Number.isFinite(a.bonus)&&dice?{name:a.name,type:'Action',attackBonus:a.bonus,damageDice:a.dice,damageType:a.type||'damage',effect:a.note||'',source,resourceId:a.resourceId||'',cost:a.cost||0}:null;};
  const attacks=(creature?.actions||[]).map(a=>converted(a,creature.source)).filter(Boolean);
  for(const a of t.extraAttacks||[])if(Number.isFinite(a.bonus))attacks.push({name:a.name,type:'Action',attackBonus:a.bonus,damageDice:`${a.count}d${a.sides}${a.modifier>=0?'+':''}${a.modifier}`,damageType:a.damage||'damage',effect:'',source:'Encounter override'});
  const actions=(creature?.actions||[]).filter(a=>!Number.isFinite(a.bonus)).map(a=>({name:a.name,type:'Action',effect:a.note||a.description||'Read the source and enter a ruling.',damageDice:a.dice||'',damageType:a.type||'',source:creature.source}));
  return {name:t.name,attacks,actions,spells:[],features:[],resources:(s.combatRun.resources[id]||[]).map((p,i)=>({...p,id:p.id||`npc-resource-${i}`}))};
 }
 function sequenceAllowed(s,r){
  if(r.source!=='dm'||r.actionType!=='attack'||r.sequenceStep<0)return false;
  const t=token(s,r.characterId);if(!t||s.party[t.id])return false;
  const attacks=actorView(s,t.id).attacks,steps=globalThis.ECHO_COMBAT_RUN.sequence(t,attacks);
  const step=steps[r.sequenceStep],q=s.combatRun.queue;
  return !!step&&step.attackIndex===r.actionIndex&&q.key===`${s.scene}:${s.turn.round}:${t.id}`&&!q.done[r.sequenceStep];
 }
 function stage(s,{actorId,actionType='attack',actionIndex=0,targetIds=[],entry=null,casting=null,sequenceStep=-1,damageJobId=''}){
  const t=token(s,actorId);if(!t)throw Error('Choose a combatant.');
  const definition=entry||actorView(s,actorId)[fields[actionType]]?.[actionIndex];
  if(!definition||definition.prepared===false)throw Error('Choose an available action.');
  if(targetIds.some(id=>!token(s,id)))throw Error('Choose current targets.');
  const r={id:`dm-action-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,source:'dm',custom:!!entry,characterId:actorId,scene:s.scene,actionType,actionIndex,entry:copy(definition),label:definition.name,targetIds:[...new Set(targetIds)],targetNames:targetIds.map(id=>token(s,id).name),casting:casting?copy(casting):null,sequenceStep,damageJobId,note:'',mode:'normal',revision:1,status:'waiting',transitions:[],resolution:null,at:new Date().toISOString()};
  api().transition(r,'waiting','Staged by DM; nothing spent or applied.');api().data(s).requests.push(r);return r;
 }
 function fromDamage(s,job){
  const existing=api().data(s).requests.find(r=>r.damageJobId===job.id&&api().pending(r));if(existing)return {request:existing,plan:null};
  if(job.scene!==s.scene||job.status!=='staged')throw Error('Return to this staged damage scene.');
  const actorId=job.actorId||s.turn.order[s.turn.index]||job.targets[0];
  const r=stage(s,{actorId,actionType:'action',entry:{name:job.label,type:job.reactionDamage?'Reaction':job.actorId?'Action':'No action',effect:'Reviewed damage event; confirm its components and any unusual effects.'},targetIds:job.targets,damageJobId:job.id});
  const plan=api().initialPlan(s,r);plan.effectRulingRequired=false;plan.reactionsChecked=!!job.reactionsChecked;
  const batch=job.saveBatchId?s.combatPlus.saves.find(b=>b.id===job.saveBatchId):null;
  plan.steps=job.targets.map(targetId=>({targetId,kind:job.attack?'attack':batch?'save':'damage',notation:'',manual:'',bonus:0,mode:'normal',damageType:'',saveAbility:batch?.ability.toUpperCase()||'DEX',dc:batch?.dc||10,saveBatchId:job.saveBatchId||'',success:job.success||'half',cover:job.attack?.cover||0,ac:job.attack?Number(token(s,targetId).ac)+Number(job.attack.cover||0)+Number(job.attack.acBonus||0):'',crit:job.attack?.crit||20,attackMethod:job.attack?'physical':'digital',attackTotal:job.attack?.total??'',natural:job.attack?.natural??'',condition:'',conditionWhen:'always',acSet:'',concentrationMethod:'reminder',components:job.components.map(c=>({...copy(c),type:c.type,manual:c.amount,notation:''}))}));
  return {request:r,plan};
 }
 globalThis.ECHO_COMBAT_ACTIONS={actorView,sequenceAllowed,stage,fromDamage,prepare:(...args)=>api().prepare(...args),apply:(...args)=>api().apply(...args),undo:(...args)=>api().undo(...args)};
})();

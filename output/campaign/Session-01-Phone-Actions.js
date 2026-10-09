(() => {
 'use strict';
 const clip=(v,n=1000)=>String(v??'').slice(0,n), copy=v=>structuredClone(v), same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const pending=r=>['waiting','needs clarification'].includes(r.status);
 const castingData=c=>c&&typeof c==='object'?{mode:['slot','feature','ritual'].includes(c.mode)?c.mode:'slot',resourceId:clip(c.resourceId,80),notation:clip(c.notation,40),effect:clip(c.effect,600),concentration:['auto','set','keep'].includes(c.concentration)?c.concentration:'auto'}:null;
 const fields={attack:'attacks',action:'actions',spell:'spells',resource:'resources'};
 const statuses=['waiting','needs clarification','approved','resolved','declined','cancelled','undone'];
 const uuid=()=>`pa-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
 const get=(s,id)=>s.tokens.find(t=>t.id===id);
 const owner=(s,id)=>globalThis.ECHO_PARTY_DATA.ownerView(s.party[id]);
 function definition(s,r){return owner(s,r.characterId)[fields[r.actionType]]?.[r.actionIndex];}
 function normalize(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  return {version:1,requests:(Array.isArray(raw.requests)?raw.requests:[]).slice(-200).filter(r=>r&&typeof r.id==='string'&&typeof r.characterId==='string').map(r=>({
   id:clip(r.id,100),characterId:clip(r.characterId,80),scene:clip(r.scene,80),actionType:fields[r.actionType]?r.actionType:'action',actionIndex:Number.isInteger(r.actionIndex)?r.actionIndex:-1,
   entry:r.entry&&typeof r.entry==='object'?copy(r.entry):{},label:clip(r.label,100),targetIds:[...new Set((Array.isArray(r.targetIds)?r.targetIds:[]).filter(x=>typeof x==='string'))].slice(0,20),targetNames:(Array.isArray(r.targetNames)?r.targetNames:[]).map(x=>clip(x,80)).slice(0,20),
   casting:castingData(r.casting),note:clip(r.note,600),mode:['normal','advantage','disadvantage'].includes(r.mode)?r.mode:'normal',revision:Math.max(1,Number(r.revision)||1),status:statuses.includes(r.status)?r.status:'needs clarification',message:clip(r.message,600),at:clip(r.at,40),
   transitions:(Array.isArray(r.transitions)?r.transitions:[]).slice(-25).map(t=>({status:clip(t.status,30),at:clip(t.at,40),note:clip(t.note,600)})),
   resolution:r.resolution&&typeof r.resolution==='object'?copy(r.resolution):null
  }))};
 }
 const data=s=>s.phoneActions ||= normalize();
 function transition(r,status,message=''){r.status=status;r.message=clip(message,600);r.transitions.push({status,at:new Date().toISOString(),note:r.message});r.transitions=r.transitions.slice(-25);}
 function receive(s,event,visible){
  const d=data(s),old=d.requests.find(r=>r.id===event.requestId);
  if(['action-revise','action-cancel'].includes(event.kind)){
   if(!old||old.characterId!==event.characterId||!pending(old)||old.revision!==event.expectedRevision)throw Error('This request has already changed. Refresh its status before trying again.');
   if(event.kind==='action-cancel'){old.revision++;transition(old,'cancelled','Cancelled by player.');return old;}
  }else if(old){if(old.characterId!==event.characterId)throw Error('Request unavailable.');return old;}
  if(event.scene!==s.scene)throw Error('The scene changed. Choose targets again.');
  if(!fields[event.actionType]||!Number.isInteger(event.actionIndex))throw Error('Choose a current action.');
  const entry=definition(s,event);if(!entry||entry.prepared===false||event.actionName!==entry.name)throw Error('Your sheet changed. Choose the action again.');
  if(!same(event.entry,entry))throw Error('The action details changed. Refresh your phone sheet.');
  const targets=[...new Set(event.targetIds||[])];
  if(targets.length>20||targets.some(id=>id!==event.characterId&&!visible.includes(id)))throw Error('One of those targets is no longer visible.');
  if(!old&&d.requests.filter(r=>pending(r)&&r.characterId===event.characterId).length>=8)throw Error('Finish or cancel an earlier request first.');
  const r=old||{id:clip(event.requestId||uuid(),100),characterId:event.characterId,revision:0,transitions:[],resolution:null};
  Object.assign(r,{scene:s.scene,actionType:event.actionType,actionIndex:event.actionIndex,entry:copy(entry),label:entry.name,targetIds:targets,targetNames:targets.map(id=>get(s,id)?.name||'Target'),casting:castingData(event.casting),note:clip(event.note,600),mode:['normal','advantage','disadvantage'].includes(event.mode)?event.mode:'normal',at:new Date().toISOString()});
  r.revision++;transition(r,'waiting',old?'Revised by player; awaiting review.':'Waiting for DM review.');if(!old)d.requests.push(r);if(d.requests.length>200){const removable=d.requests.findIndex(x=>!pending(x)&&x.id!==r.id);if(removable>=0)d.requests.splice(removable,1);}return r;
 }
 function publicRequests(s,id){return data(s).requests.filter(r=>r.characterId===id).slice(-40).map(r=>({id:r.id,label:r.label,status:r.status,message:r.message,revision:r.revision,actionType:r.actionType,actionIndex:r.actionIndex,targetIds:r.targetIds,targetNames:r.targetNames,note:r.note,mode:r.mode,casting:r.casting,
  history:r.transitions.map(t=>({status:t.status,at:t.at})),result:r.resolution?.summary||'',rolls:(r.resolution?.rolls||[]).filter(v=>v.public).map(({id,label,notation,parts,total})=>({id,label,notation,parts,total}))}));}
 function initialPlan(s,r){
  const own=owner(s,r.characterId);let a=definition(s,r);
  if(r.actionType==='spell')a=own.actions.find(x=>x.name.toLowerCase()===a.name.toLowerCase())||own.attacks.find(x=>x.name.toLowerCase()===a.name.toLowerCase())||a;
  if(!a)throw Error('Choose this action again from the current phone sheet.');
  const effect=a.effect||a.notes||'',type=(a.type||'').toLowerCase();
  const resourceId=a.resourceId||(r.actionType==='resource'?own.resources[r.actionIndex]?.id:'');
  let costs=resourceId?[{id:resourceId,delta:-(Number(a.cost)||1)}]:[];
  const healing=/^heal\b|regain.*hit points/i.test(effect)||/second wind|healing word|cure wounds/i.test(a.name);
  const kind=Number.isFinite(a.attackBonus)?'attack':healing?'heal':a.saveAbility&&a.saveDC?'save':a.damageDice?'roll':'effect';
  const usage=type.includes('bonus')?'bonus':type.includes('reaction')?'reaction':/^(action|spell action|ritual or action)$/.test(type)?'action':r.actionType==='attack'||r.actionType==='spell'?'action':'none';
  let concentration=/concentration/i.test(effect)&&!/no concentration|without concentration/i.test(effect)?a.name:'';
  const targets=r.targetIds.length?r.targetIds:healing&&/second wind/i.test(a.name)?[r.characterId]:[];
  let castEffect='',castOverride='';
  if(r.actionType==='spell'&&r.casting){
   const c=r.casting,spell=definition(s,r),pool=own.resources.find(p=>p.id===c.resourceId);
   if(Number(spell.level)>0&&c.mode!=='ritual'){
    if(!pool)throw Error('Choose a casting resource.');
    const slot=globalThis.ECHO_CHARACTER_TOOLS?.slotLevel(pool)||pool.slotLevel||0;
    if(c.mode==='slot'&&slot<Number(spell.level))throw Error('The selected spell slot is below the spell’s level.');
    costs=[{id:pool.id,delta:-1}];
    castEffect=`Casting with ${pool.name}. ${slot>spell.level?'Upcast: review every extra die, target and duration. ':''}`;
   }else if(c.mode==='ritual'||Number(spell.level)===0)costs=[];
   if(c.mode!=='slot'){if(!c.effect.trim())throw Error('Record the feature or ritual ruling.');castOverride=c.effect;}
   if(c.concentration==='set')concentration=spell.name;
   if(c.concentration==='keep'&&concentration){if(!c.effect.trim())throw Error('Explain the concentration exception.');concentration='';castOverride=c.effect;}
   if(c.notation)a={...a,damageDice:c.notation};
   castEffect+=c.effect;
  }
  return {usage,override:castOverride,concentration:concentration?'set':'keep',concentrationName:concentration,grantAction:false,costs,
   effectNote:[effect,castEffect].filter(Boolean).join('\n'),acknowledged:false,
   steps:targets.map(targetId=>({targetId,kind,sharedRoll:kind==='save'?'area':'',notation:a.damageDice||'',bonus:Number.isFinite(a.attackBonus)?a.attackBonus:0,mode:r.mode,damageType:a.damageType||'',saveAbility:a.saveAbility||'DEX',dc:a.saveDC||10,success:/half/i.test(effect)?'half':'none',cover:0,ac:'',condition:'',conditionWhen:'always',acSet:'',manual:'',crit:own.features.some(f=>f.name==='Improved Critical')&&r.actionType==='attack'?19:20}))};
 }
 function fingerprint(s,r){return JSON.stringify({revision:r.revision,status:r.status,scene:s.scene,turn:s.turn,tokens:s.tokens,actor:s.party[r.characterId],combat:s.combat,queue:s.combatRun?.queue,pauses:s.combatPlus?.pauses,saves:s.combatPlus?.saves});}
 function validate(s,r,plan,visible){
  if(s.combatPlus?.pauses.some(p=>p.scene===s.scene&&p.status==='open')&&plan.usage!=='reaction')throw Error('Resolve the open reaction window first.');
  if(!r||!pending(r))throw Error('This request is no longer waiting for approval.');
  if(r.scene!==s.scene)throw Error('The scene changed. Ask the player to revise the request.');
  if(!same(definition(s,r),r.entry))throw Error('The character’s action changed. Ask for a revised request.');
  if(!plan.acknowledged)throw Error('Review targets, costs, timing, and the complete effect before preparing.');
  if(!['action','bonus','reaction','none'].includes(plan.usage))throw Error('Choose action usage.');
  const active=s.turn.scene===s.scene&&s.turn.order?.length,actor=s.turn.order?.[s.turn.index],q=s.combatRun.queue;
  if(active&&['action','bonus'].includes(plan.usage)&&actor!==r.characterId&&!plan.override.trim())throw Error('This is not that character’s turn. Add a timing override or request clarification.');
  const key=`${s.scene}:${s.turn.round}:${r.characterId}`;
  if(active&&q.key===key&&((plan.usage==='action'&&q.actionUsed)||(plan.usage==='bonus'&&q.bonusUsed))&&!plan.override.trim())throw Error('That action is already used. Explain any extra action or override.');
  if(plan.usage==='reaction'&&s.combat.tokens[r.characterId]?.reactionUsed&&!plan.override.trim())throw Error('The reaction is already used. Explain an override.');
  if(!['keep','set','end'].includes(plan.concentration)||plan.concentration==='set'&&!plan.concentrationName.trim())throw Error('Name the concentration effect.');
  const expected=initialPlan(s,r);
  if(!plan.override.trim()){
   if(expected.costs.some(c=>!plan.costs.some(p=>p.id===c.id&&Number(p.delta)<=c.delta)))throw Error('The listed resource cost is missing. Restore it or explain the exception.');
   if(r.actionType==='spell'&&Number(r.entry.level)>0&&!plan.costs.some(c=>Number(c.delta)<0))throw Error('Choose the spell slot or explain a ritual / free casting.');
   if(expected.usage!=='none'&&plan.usage==='none')throw Error('Explain why this action uses no action.');
   if(expected.concentration==='set'&&plan.concentration!=='set')throw Error('Set concentration or explain the exception.');
  }
  const totals=new Map();for(const cost of plan.costs){if(!Number.isInteger(Number(cost.delta)))throw Error('Resource changes must be whole numbers.');totals.set(cost.id,(totals.get(cost.id)||0)+Number(cost.delta));}
  for(const [id,delta]of totals){const pool=s.party[r.characterId].resources.find(v=>v.id===id);if(!pool||!Number.isFinite(pool.current)||pool.current+delta<0||pool.current+delta>pool.max)throw Error('A resource is unavailable or its recovery exceeds the maximum.');}
  if(!Array.isArray(plan.steps)||plan.steps.length>40)throw Error('Use at most 40 resolution steps.');
  if(!plan.steps.length&&r.actionType==='attack')throw Error('Choose the attack target before resolving.');
  if(!plan.steps.length&&!plan.effectNote.trim())throw Error('Describe the non-token effect or choose a target.');
  for(const step of plan.steps){if(!get(s,step.targetId)||(step.targetId!==r.characterId&&!visible.includes(step.targetId)))throw Error('A reviewed target is unavailable or hidden.');
   if(!['attack','save','damage','heal','effect','roll'].includes(step.kind))throw Error('Choose a resolution type.');
   if(step.condition&&!globalThis.ECHO_PHONE_ACTION_CONDITIONS?.includes(step.condition))throw Error('Choose a supported condition.');
   if(!['normal','advantage','disadvantage'].includes(step.mode))throw Error('Choose a roll mode.');
   if(step.kind==='attack'&&(!Number.isInteger(Number(step.bonus))||Math.abs(Number(step.bonus))>99||!Number.isInteger(Number(step.crit))||step.crit<1||step.crit>20))throw Error('Confirm attack modifier and critical range.');
   if(step.kind==='save'&&(!['STR','DEX','CON','INT','WIS','CHA'].includes(step.saveAbility)||!Number.isInteger(Number(step.dc))||step.dc<1||step.dc>99))throw Error('Confirm save ability and DC.');
   if(['attack','damage','heal'].includes(step.kind)&&!step.notation&&step.manual==='')throw Error('Set damage/healing dice, a manual amount, or choose effect-only resolution.');
   if(step.kind==='attack'&&step.cover==='full')throw Error('A target behind full cover cannot be attacked without a different ruling.');
  }
 }
 function roll(notation,mode,label,dice,publicRoll=true){
  const match=/^(\d{1,2})d(4|6|8|10|12|20|100)([+-]\d{1,3})?$/.exec(String(notation).replace(/\s+/g,''));
  if(!match)throw Error(`Use dice such as 1d20+4 or 2d6: ${notation}`);
  const count=Number(match[1]),sides=Number(match[2]),mod=Number(match[3]||0);if(count<1||count>40)throw Error('Use 1–40 dice per step.');
  const advantage=count===1&&sides===20&&['advantage','disadvantage'].includes(mode);
  const parts=Array.from({length:advantage?2:count},()=>dice(sides));if(parts.some(n=>!Number.isInteger(n)||n<1||n>sides))throw Error('Invalid die result.');
  const natural=advantage?(mode==='advantage'?Math.max(...parts):Math.min(...parts)):parts[0];
  return {id:uuid(),label,notation:`${advantage?mode+' ':''}${notation}`,parts,total:(advantage?natural:parts.reduce((a,b)=>a+b,0))+mod,natural,public:publicRoll,kind:'digital',time:new Date().toLocaleTimeString()};
 }
 const mod=n=>Number(n)>=0?`+${Number(n)}`:String(Number(n));
 function prepare(s,r,plan,ctx){
  validate(s,r,plan,ctx.visible);const signature=fingerprint(s,r),next=copy(s),rolls=[],outcomes=[],sharedRolls=new Map();
  const held=(key,notation,mode,label,pub=true)=>{const cache=ctx.cache,stamp=JSON.stringify([key,notation,mode,label,pub]);if(cache?.[stamp])return copy(cache[stamp]);const value=roll(notation,mode,label,ctx.die,pub);if(cache)cache[stamp]=copy(value);return value;};
  const own=next.party[r.characterId],actor=get(next,r.characterId),combat=id=>next.combat.tokens[id] ||= globalThis.ECHO_COMBAT_DATA.creatureDefense(get(next,id)?.type,next.combat.creatures);
  for(const c of plan.costs)own.resources.find(p=>p.id===c.id).current+=Number(c.delta);
  for(const [i,step]of plan.steps.entries()){
   const target=get(next,step.targetId),defense=combat(target.id);let multiplier=1,hit=true,crit=false,amount=0,notes=[];
   if(step.kind==='attack'){
    const attack=held(`attack:${i}:${target.id}`,`1d20${mod(step.bonus)}`,step.mode,`${r.label} · attack ${i+1}`);rolls.push(attack);
    const ac=step.ac!==''?Number(step.ac):target.ac===null?null:Number(target.ac)+Number(step.cover||0);
    if(ac===null||!Number.isFinite(ac))throw Error('Confirm the target AC before resolving the attack.');
    crit=attack.natural>=Number(step.crit||20);hit=attack.natural!==1&&(crit||attack.total>=ac);multiplier=hit?1:0;notes.push(hit?(crit?'critical hit':'hit'):'miss');
   }
   if(step.kind==='save'){
    const bonus=ctx.saveBonus(target.id,step.saveAbility.toLowerCase());if(!Number.isFinite(bonus))throw Error(`Set ${target.name}’s ${step.saveAbility} save bonus first.`);
    let saved;const batch=step.saveBatchId?next.combatPlus?.saves.find(b=>b.id===step.saveBatchId):null;
    if(step.saveBatchId){const result=batch?.targets.find(t=>t.id===target.id);if(!result||!['passed','failed'].includes(result.status)||batch.ability!==step.saveAbility.toLowerCase()||batch.dc!==Number(step.dc))throw Error('Collect a matching saving throw for each linked target.');saved={total:result.status==='passed'?Number(step.dc):Number(step.dc)-1};}
    else{saved=held(`save:${i}:${target.id}`,`1d20${mod(bonus)}`,step.mode,`${target.name} · ${step.saveAbility} save`,false);rolls.push(saved);}
    hit=saved.total<Number(step.dc);multiplier=hit?1:step.success==='half'?.5:0;notes.push(hit?'failed save':'saved');
   }
   if(step.notation&&step.kind!=='effect'){
    let notation=step.notation;if(crit)notation=notation.replace(/^(\d+)d/,(_,n)=>`${Number(n)*2}d`);
    const group=clip(step.sharedRoll||'',80);let rolled=group?sharedRolls.get(group):null;
    if(rolled&&rolled.notation!==notation)throw Error('Shared dice groups must use the same notation.');
    if(!rolled){rolled=held(`effect:${i}:${target.id}`,notation,'normal',`${r.label} · ${step.kind==='heal'?'healing':'effect'} ${i+1}`);rolls.push(rolled);if(group)sharedRolls.set(group,rolled);}amount=Math.max(0,Math.floor(rolled.total*multiplier));
   }
   if(step.manual!==''){const n=Number(step.manual);if(!Number.isFinite(n)||n<0||n>999)throw Error('Manual damage/healing must be 0–999.');amount=n;notes.push('DM amount override');}
   if(['attack','save','damage','heal'].includes(step.kind)&&amount>0){
    if(!Number.isFinite(target.hp)||!Number.isFinite(target.maxHp))throw Error(`Set ${target.name}’s HP before applying damage or healing.`);
    const beforeHp=target.hp,result=globalThis.ECHO_COMBAT_DATA.damagePreview(target,amount,step.damageType,step.kind==='heal'?'heal':'damage',defense);
    target.hp=result.hp;target.tempHp=result.tempHp;notes.push(`${step.kind==='heal'?'healing':'damage'} ${result.adjusted}`);
    if(next.party[target.id]){const sh=next.party[target.id];sh.hp=target.hp;sh.tempHp=target.tempHp;
     if(step.kind==='heal'&&target.hp>0&&beforeHp===0)sh.death={successes:0,failures:0,stable:false};
     else if(step.kind!=='heal'&&beforeHp===0&&result.adjusted>0)sh.death={...(sh.death||{successes:0,failures:0}),stable:false,failures:Math.min(3,(sh.death?.failures||0)+(crit?2:1))};
    }
    if(step.kind!=='heal'&&result.adjusted>0&&defense.concentration&&target.hp>0){
     const bonus=ctx.saveBonus(target.id,'con');if(!Number.isFinite(bonus))throw Error(`Set ${target.name}’s Constitution save bonus before resolving concentration.`);
     const check=held(`concentration:${i}:${target.id}`,`1d20${mod(bonus)}`,step.concentrationMode||'normal',`${target.name} · concentration DC ${Math.max(10,Math.floor(result.adjusted/2))}`,false);rolls.push(check);
     if(check.total<Math.max(10,Math.floor(result.adjusted/2))){defense.concentration='';target.conditions=target.conditions.filter(c=>c!=='Concentrating');if(next.party[target.id])next.party[target.id].concentration='';notes.push('concentration ended');}else notes.push('concentration held');
    }
   }
   if(step.condition&&(step.conditionWhen==='always'||hit)){target.conditions=[...new Set([...target.conditions,step.condition])];notes.push(step.condition);}
   if(step.acSet!==''){const ac=Number(step.acSet);if(!Number.isInteger(ac)||ac<0||ac>99)throw Error('AC must be 0–99.');target.ac=ac;if(next.party[target.id])next.party[target.id].ac=ac;notes.push('AC updated');}
   outcomes.push({targetId:target.id,text:`${r.targetNames[r.targetIds.indexOf(target.id)]||target.name}: ${notes.join(', ')||'effect reviewed'}`});
  }
  if(plan.concentration!=='keep'){const value=plan.concentration==='set'?clip(plan.concentrationName,120):'';own.concentration=value;combat(actor.id).concentration=value;actor.conditions=actor.conditions.filter(c=>c!=='Concentrating');if(value)actor.conditions.push('Concentrating');}
  for(const t of next.tokens.filter(t=>t.id===r.characterId||plan.steps.some(p=>p.targetId===t.id))){if(t.hp===0||t.conditions.some(c=>['Incapacitated','Unconscious','Stunned','Paralyzed','Petrified'].includes(c))){const record=next.combat.tokens[t.id];if(record)record.concentration='';t.conditions=t.conditions.filter(c=>c!=='Concentrating');if(next.party[t.id])next.party[t.id].concentration='';}}
  const isTurn=next.turn.scene===next.scene&&next.turn.order?.[next.turn.index]===r.characterId;
  if(isTurn){const key=`${next.scene}:${next.turn.round}:${r.characterId}`;if(next.combatRun.queue.key!==key)Object.assign(next.combatRun.queue,{key,done:[],movementUsed:0,actionUsed:false,bonusUsed:false});
   if(plan.usage==='action')next.combatRun.queue.actionUsed=true;if(plan.usage==='bonus')next.combatRun.queue.bonusUsed=true;if(plan.grantAction)next.combatRun.queue.actionUsed=false;
  }else if(plan.grantAction)throw Error('Grant an additional action only on the actor’s current turn.');
  if(plan.usage==='reaction')combat(r.characterId).reactionUsed=true;
  const patches=[];
  const patch=(kind,id,field,before,after)=>{if(!same(before,after))patches.push({kind,id,field,before:copy(before??null),after:copy(after??null)});};
  for(const t of next.tokens){const old=get(s,t.id);for(const f of ['hp','tempHp','ac','conditions'])patch('token',t.id,f,old[f],t[f]);}
  for(const [id,sh]of Object.entries(next.party)){const old=s.party[id];for(const f of ['hp','tempHp','ac','concentration','death'])patch('sheet',id,f,old[f],sh[f]);for(const pool of sh.resources||[])patch('resource',id,pool.id,old.resources.find(x=>x.id===pool.id)?.current,pool.current);}
  for(const [id,record]of Object.entries(next.combat.tokens)){const old=s.combat.tokens[id]||{};for(const f of ['concentration','reactionUsed'])patch('combat',id,f,old[f],record[f]);}
  if(!same(s.combatRun.queue,next.combatRun.queue))patches.push({kind:'queue',id:'',field:'',before:copy(s.combatRun.queue),after:copy(next.combatRun.queue)});
  const effects=next.combat.effects.filter(e=>!s.combat.effects.some(x=>x.id===e.id));
  return {requestId:r.id,revision:r.revision,signature,plan:copy(plan),patches,effects,rolls,outcomes,summary:outcomes.map(x=>x.text).join('; ')||'Effect reviewed and recorded.',at:new Date().toISOString()};
 }
 function holder(s,p){if(p.kind==='token')return get(s,p.id);if(p.kind==='sheet')return s.party[p.id];if(p.kind==='resource')return s.party[p.id]?.resources.find(x=>x.id===p.field);if(p.kind==='combat')return s.combat.tokens[p.id] ||= {};if(p.kind==='queue')return s.combatRun;}
 const key=p=>p.kind==='resource'?'current':p.kind==='queue'?'queue':p.field;
 function apply(s,review,visible){const r=data(s).requests.find(x=>x.id===review.requestId);validate(s,r,review.plan,visible);if(fingerprint(s,r)!==review.signature)throw Error('The table changed after this preview. Prepare the review again.');const next=copy(s),target=data(next).requests.find(x=>x.id===r.id);
  for(const p of review.patches)holder(next,p)[key(p)]=copy(p.after);
  next.combat.effects.push(...copy(review.effects));next.rolls.unshift(...copy(review.rolls));next.rolls=next.rolls.slice(0,50);
  transition(target,'approved','Approved by DM.');target.resolution=copy(review);delete target.resolution.signature;
  transition(target,'resolved',review.summary);next.phoneReplies[r.characterId]=`${r.label} resolved.`;return next;
 }
 function undo(s,id){const r=data(s).requests.find(r=>r.id===id);if(r?.status!=='resolved'||!r.resolution)throw Error('Choose a resolved action.');const next=copy(s),res=r.resolution;
  for(const p of res.patches){if(p.kind==='queue'&&next.combatRun.queue.key!==p.after.key)continue;const h=holder(next,p);if(!h||!same(h[key(p)]??null,p.after))throw Error('A value changed after this action. Use session Undo for intervening changes before undoing this resolution.');}
  for(const e of res.effects){const now=next.combat.effects.find(x=>x.id===e.id);if(now&&!same(now,e))throw Error('A resulting reminder was edited; review that change before undoing.');}
  for(const p of res.patches){if(p.kind==='queue'&&next.combatRun.queue.key!==p.after.key)continue;holder(next,p)[key(p)]=copy(p.before);}
  next.combat.effects=next.combat.effects.filter(x=>!res.effects.some(e=>e.id===x.id));next.rolls=next.rolls.filter(x=>!res.rolls.some(e=>e.id===x.id));if(!next.rolls.some(x=>x.id===next.publicRollId))next.publicRollId=null;
  const row=data(next).requests.find(x=>x.id===id);transition(row,'undone','Resolution undone by DM. Send a new request if needed.');next.phoneReplies[r.characterId]=`${r.label} was undone by the DM.`;return next;
 }
 globalThis.ECHO_PHONE_ACTIONS={normalize,data,pending,definition,receive,publicRequests,initialPlan,prepare,apply,undo,transition,fingerprint};
})();

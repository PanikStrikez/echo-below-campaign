(() => {
 'use strict';
 const clone=structuredClone,clip=(v,n=200)=>String(v??'').slice(0,n),id=()=>`cp-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
 const modes=['normal','advantage','disadvantage'],abilities=['str','dex','con','int','wis','cha'],types=['acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder'];
 const token=(s,id)=>s.tokens.find(t=>t.id===id),num=(v,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):min;
 const turnKey=s=>`${s.scene}:${s.turn.round}:${s.turn.order[s.turn.index]||''}`;
 const own=s=>s.combatPlus ||= normalize();
 function normalize(raw={}){raw||={};const rows=(key,max=100)=>(Array.isArray(raw[key])?raw[key]:[]).filter(r=>r&&typeof r==='object'&&typeof r.id==='string').slice(-max).map(v=>clone(v));
  return {version:1,reach:raw.reach&&typeof raw.reach==='object'?clone(raw.reach):{},calibration:raw.calibration&&typeof raw.calibration==='object'?clone(raw.calibration):{},saves:rows('saves',60),pauses:rows('pauses',60),damage:rows('damage',60),areas:rows('areas'),events:rows('events'),reminders:rows('reminders',200),defenses:raw.defenses&&typeof raw.defenses==='object'?clone(raw.defenses):{},acEffects:rows('acEffects',60),movement:raw.movement&&typeof raw.movement==='object'?clone(raw.movement):null,phases:raw.phases&&typeof raw.phases==='object'?clone(raw.phases):{}};
 }
 function scale(s,columns=24){const c=own(s).calibration[s.scene]||{};return {columns:num(c.columns||columns,1,200),feet:num(c.feet||5,1,100),metric:c.metric==='euclidean'?'euclidean':'grid'};}
 function distance(a,b,c){const x=Math.abs(b.x-a.x),y=Math.abs(b.y-a.y)*2/3;return (c.metric==='euclidean'?Math.hypot(x,y):Math.max(x,y))*c.columns*c.feet/100;}
 function speed(s,t){const sh=s.party[t.id],creature=globalThis.ECHO_COMBAT_DATA?.CREATURES?.[t.type]||s.combat?.creatures?.[t.type];let value=sh?Number(sh.speed):parseFloat(creature?.speed);if(!Number.isFinite(value))value=null;
  if(t.conditions.some(c=>['Grappled','Restrained','Paralyzed','Petrified','Stunned','Unconscious'].includes(c)))return 0;
  if(value!==null&&sh?.rules?.startsWith('2024'))value=Math.max(0,value-5*(t.exhaustion||0));
  if((t.exhaustion||0)>=6||!sh?.rules?.startsWith('2024')&&(t.exhaustion||0)>=5)return 0;
  if(value!==null&&(t.exhaustion||0)>=2&&!sh?.rules?.startsWith('2024'))value=Math.floor(value/2);return value;
 }
 function suggest(s,actorId,targetId,kind='attack',ability='',feet=null){const a=token(s,actorId),b=token(s,targetId),yes=[],no=[],notes=[];if(!a)return {mode:'normal',yes,no,notes};const has=(t,c)=>t?.conditions?.includes(c);
  if(kind==='attack'){
   for(const c of ['Blinded','Poisoned','Prone','Restrained'])if(has(a,c))no.push(`${a.name}: ${c.toLowerCase()} affects attack rolls.`);
   if(has(a,'Frightened'))notes.push('Frightened: disadvantage applies while the fear source is in sight; confirm with the DM.');
   if(has(a,'Invisible'))notes.push('Invisible attacker: consider advantage after checking the target’s senses and this character’s rules profile.');
   for(const c of ['Blinded','Restrained','Paralyzed','Petrified','Stunned','Unconscious'])if(has(b,c))yes.push(`${b.name}: attacks against a ${c.toLowerCase()} target have advantage.`);
   if(has(b,'Prone')){if(feet===null)notes.push('Prone target: advantage within 5 feet; disadvantage farther away.');else (feet<=5?yes:no).push(`Prone target at ${feet.toFixed(1)} feet: ${feet<=5?'advantage':'disadvantage'}.`);}
   if(has(b,'Invisible'))notes.push('Invisible target: check senses and location; disadvantage may apply.');
   if(['Paralyzed','Unconscious'].some(c=>has(b,c)))notes.push('A hit within 5 feet is critical under the 2014 condition rules; confirm distance and critical damage.');
  }else if(kind==='save'){
   if(ability==='dex'&&has(a,'Restrained'))no.push('Restrained gives disadvantage on Dexterity saves.');
   if((a.exhaustion||0)>=3)notes.push('Legacy exhaustion level 3 affects saving throws; verify this character’s rules profile.');
   if(['str','dex'].includes(ability)&&['Paralyzed','Petrified','Stunned','Unconscious'].some(c=>has(a,c)))notes.push('This condition normally causes automatic STR/DEX save failure. Enter a DM result instead of requesting a roll.');
   if(ability==='dex'&&has(a,'Dodging'))notes.push('Dodge can give advantage on Dexterity saves if its requirements still hold.');
  }
  return {mode:yes.length&&!no.length?'advantage':no.length&&!yes.length?'disadvantage':'normal',yes,no,notes,source:'2014 PHB conditions pp. 290–292; verify character exceptions.'};
 }
 function reminder(s,area,t,point,text){const d=own(s),key=`${area.id}:${t.id}:${point}:${turnKey(s)}`;if(d.reminders.some(r=>r.key===key))return;d.reminders.push({id:id(),key,scene:s.scene,areaId:area.id,tokenId:t.id,title:`${area.name}: ${t.name} · ${point}`,text:clip(text||area.note,1000),done:false,at:new Date().toISOString()});d.reminders=d.reminders.slice(-200);}
 function movementPreview(s,actorId,path,columns=24,extra=0){const t=token(s,actorId);if(!t||!t.placed||t.scene!==s.scene)throw Error('Choose a token on this map.');if(!Array.isArray(path)||path.length<2||path.length>80||path.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>100||p.y<0||p.y>100))throw Error('Choose a valid movement path.');
  if(distance(t,path[0],scale(s,columns))>.1)throw Error('The token moved. Start a new path.');const c=scale(s,columns),areas=own(s).areas.filter(a=>a.active&&a.scene===s.scene),crawl=t.conditions.includes('Prone')?1:0;let length=0,cost=0,difficult=0;const entered=new Set(),opportunities=new Set();
  const foes=s.tokens.filter(o=>o.placed&&o.scene===s.scene&&o.id!==t.id&&o.hp>0&&(t.team==='enemy'?o.team!=='enemy':o.team==='enemy'));
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],len=distance(a,b,c),samples=Math.min(512,Math.max(1,Math.ceil(len/.25)));length+=len;
   for(let k=1;k<=samples;k++){const prev={x:a.x+(b.x-a.x)*(k-1)/samples,y:a.y+(b.y-a.y)*(k-1)/samples},p={x:a.x+(b.x-a.x)*k/samples,y:a.y+(b.y-a.y)*k/samples},mid={x:(prev.x+p.x)/2,y:(prev.y+p.y)/2};const hard=areas.some(v=>v.difficult&&globalThis.ECHO_COMBAT_DATA.inShape(v.shape,mid));cost+=len/samples*(1+crawl+(hard?1:0));if(hard)difficult+=len/samples;
    for(const area of areas)if(!globalThis.ECHO_COMBAT_DATA.inShape(area.shape,prev)&&globalThis.ECHO_COMBAT_DATA.inShape(area.shape,p))entered.add(area.id);
    for(const foe of foes){const reach=num(own(s).reach[foe.id]||5,5,100);if(distance(foe,prev,c)<=reach&&distance(foe,p,c)>reach&&!s.combat.tokens[foe.id]?.reactionUsed)opportunities.add(foe.id);}
   }
  }
  const active=s.turn.scene===s.scene&&s.turn.order[s.turn.index]===actorId,used=active&&s.combatRun.queue.key===`${s.scene}:${s.turn.round}:${actorId}`?s.combatRun.queue.movementUsed:0,base=speed(s,t),budget=base===null?null:base+num(extra,0,999),remaining=budget===null?null:Math.round((budget-used-cost)*10)/10;
  return {actorId,path:clone(path),scene:s.scene,length:Math.round(length*10)/10,cost:Math.round(cost*10)/10,difficult:Math.round(difficult*10)/10,crawling:!!crawl,used,speed:base,extra:Number(extra)||0,remaining,entered:[...entered],opportunities:[...opportunities],active};
 }
 function applyMovement(s,draft,columns=24){const preview=movementPreview(s,draft.actorId,draft.path,columns,draft.extra);if(preview.speed===null)throw Error('Set this creature’s speed before moving.');if(preview.remaining<0&&!draft.override?.trim())throw Error('The path exceeds remaining movement. Shorten it or explain an override.');if(!preview.active&&s.turn.order.length&&!draft.override?.trim())throw Error('Explain movement outside the active turn.');if(preview.extra&&!draft.override?.trim())throw Error('Explain the additional movement allowance, such as Dash.');
  if(draft.pauseId&&own(s).pauses.find(p=>p.id===draft.pauseId)?.status!=='closed')throw Error('Resolve or pass the reaction window first.');
  if(preview.opportunities.length&&!draft.reactionsChecked)throw Error('Review possible opportunity attacks before moving.');const next=clone(s),t=token(next,draft.actorId),end=preview.path.at(-1);t.x=end.x;t.y=end.y;
  if(preview.active){const q=next.combatRun.queue,key=`${s.scene}:${s.turn.round}:${t.id}`;if(q.key!==key)Object.assign(q,{key,done:[],actionUsed:false,bonusUsed:false,movementUsed:0});q.movementUsed+=preview.cost;}
  for(const aid of preview.entered){const a=own(next).areas.find(a=>a.id===aid);if(a?.triggers?.includes('entry'))reminder(next,a,t,'entry');}own(next).movement=null;if(next.phoneReplies&&next.party[draft.actorId])next.phoneReplies[draft.actorId]=`Movement approved: ${preview.cost} ft used.`;let result=next;for(const gid of draft.groupIds||[]){if(gid===draft.actorId)continue;const original=token(s,gid);if(!original?.placed||original.scene!==s.scene)continue;const origin=preview.path[0],path=preview.path.map(p=>({x:p.x+original.x-origin.x,y:p.y+original.y-origin.y}));result=applyMovement(result,{...draft,actorId:gid,path,groupIds:[],pauseId:''},columns);}return result;
 }
 function placeToken(s,actorId,end,columns=24){const t=token(s,actorId);if(!t?.placed||t.scene!==s.scene)throw Error('Choose a token on this map.');
  const destination={x:Number(end?.x),y:Number(end?.y)};if(!Number.isFinite(destination.x)||!Number.isFinite(destination.y)||destination.x<0||destination.x>100||destination.y<0||destination.y>100)throw Error('Choose a position on the map.');
  if(t.x===destination.x&&t.y===destination.y)return {state:s,changed:false,notes:[]};
  const preview=movementPreview(s,actorId,[{x:t.x,y:t.y},destination],columns),next=clone(s),moved=token(next,actorId),notes=[];
  moved.x=destination.x;moved.y=destination.y;
  if(preview.active){const q=next.combatRun.queue,key=`${s.scene}:${s.turn.round}:${actorId}`;if(q.key!==key)Object.assign(q,{key,done:[],actionUsed:false,bonusUsed:false,movementUsed:0});q.movementUsed+=preview.cost;}
  for(const aid of preview.entered){const area=own(next).areas.find(a=>a.id===aid);if(area?.triggers?.includes('entry'))reminder(next,area,moved,'entry');}
  if(preview.opportunities.length){const names=preview.opportunities.map(tid=>token(next,tid)?.name||tid);notes.push(`Check opportunity attacks from ${names.join(', ')}.`);reminder(next,{id:id(),name:'Movement',note:notes.at(-1)},moved,'opportunity');}
  if(preview.active&&preview.remaining!==null&&preview.remaining<0)notes.push('Movement exceeds the listed speed; review Dash or another effect.');
  if(!preview.active&&s.turn.order.length)notes.push('Moved outside this creature’s turn.');
  own(next).movement=null;
  return {state:next,changed:true,notes};
 }
 function saveBatch(s,{label,ability,dc,targets,mode='normal',modes:targetModes={}},bonus){if(!abilities.includes(ability)||!Number.isInteger(Number(dc))||dc<1||dc>99||!targets?.length||targets.length>30)throw Error('Choose save ability, DC, and targets.');
  const batch={id:id(),scene:s.scene,label:clip(label||'Saving throw',100),ability,dc:Number(dc),status:'open',revision:1,targets:[...new Set(targets)].map(tid=>{if(!token(s,tid))throw Error('Unknown save target.');const value=bonus(tid,ability),selected=targetModes[tid]||mode;if(!modes.includes(selected))throw Error('Choose a save mode.');return {id:tid,bonus:Number.isFinite(value)?value:null,mode:selected,status:'waiting',total:null,parts:[],method:'',revision:1};})};own(s).saves.push(batch);return batch;
 }
 function saveResult(s,event,die){const batch=own(s).saves.find(b=>b.id===event.batchId),r=batch?.targets.find(t=>t.id===event.characterId);if(!batch||batch.status!=='open'||batch.scene!==s.scene||!r||r.status!=='waiting'||event.expectedRevision!==r.revision)throw Error('That saving throw is no longer waiting.');
  if(event.method==='digital'){if(!Number.isFinite(r.bonus))throw Error('The DM must set your saving throw bonus first.');r.parts=[die(20)];if(r.mode!=='normal')r.parts.push(die(20));r.total=(r.mode==='advantage'?Math.max(...r.parts):r.mode==='disadvantage'?Math.min(...r.parts):r.parts[0])+r.bonus;
  }else if(event.method==='physical'){if(!Number.isInteger(event.total)||event.total< -99||event.total>999)throw Error('Enter the final total including modifiers.');r.total=event.total;r.parts=[];}else throw Error('Choose digital or physical dice.');r.method=event.method;r.status=r.total>=batch.dc?'passed':'failed';r.revision++;return r;
 }
 function pause(s,{label,targets=[],source='',note=''}){const p={id:id(),scene:s.scene,label:clip(label,120),note:clip(note,600),source,status:'open',targets:[...new Set(targets)].filter(id=>s.party[id]).map(id=>({id,status:'waiting',note:''}))};own(s).pauses.push(p);return p;}
 function reactionReply(s,event){const p=own(s).pauses.find(p=>p.id===event.pauseId),r=p?.targets.find(r=>r.id===event.characterId);if(!p||p.status!=='open'||p.scene!==s.scene||!r||r.status!=='waiting')throw Error('This reaction window has changed.');if(!['pass','request'].includes(event.response))throw Error('Choose pass or describe a reaction.');r.status=event.response;r.note=clip(event.note,600);return r;}
 function phone(s,tid){return {saves:own(s).saves.filter(b=>b.scene===s.scene&&b.status==='open'&&b.targets.some(t=>t.id===tid)).map(b=>{const t=b.targets.find(t=>t.id===tid);return {id:b.id,label:b.label,ability:b.ability,mode:t.mode,bonus:t.bonus,status:t.status,total:t.total,parts:t.parts,revision:t.revision};}),reactions:own(s).pauses.filter(p=>p.scene===s.scene&&p.status==='open'&&p.targets.some(t=>t.id===tid)).map(p=>({id:p.id,label:p.label,status:p.targets.find(t=>t.id===tid).status,note:p.targets.find(t=>t.id===tid).note}))};}
 function defense(s,t,c){const record=s.combat.tokens[t.id]||{},out={resistances:'',vulnerabilities:'',immunities:''},notes=[],ambiguous=[];
  for(const key of Object.keys(out)){const text=String(record[key]||'').toLowerCase();if(!new RegExp(`\\b${c.type}\\b`).test(text))continue;let applies=true;
   if(/nonmagical|non-magical/.test(text)){applies=!c.magical;if(/attacks?/.test(text)&&!c.attack)applies=false;if(/silver/.test(text)&&c.silvered)applies=false;if(/adamantine/.test(text)&&c.adamantine)applies=false;}
   else if(/\b(from|while|unless|except|against)\b/.test(text)){ambiguous.push(`${key}: ${text}`);applies=false;}
   if(applies){out[key]=c.type;notes.push(`${key}: ${text}`);}
  }
  for(const rule of own(s).defenses[t.id]||[]){if(rule.type!==c.type||!['resistances','vulnerabilities','immunities'].includes(rule.kind))continue;const yes=rule.when==='always'||rule.when==='nonmagical'&&!c.magical||rule.when==='nonmagical-unsilvered'&&!c.magical&&!c.silvered||rule.when==='nonmagical-unadamantine'&&!c.magical&&!c.adamantine||rule.when==='manual'&&c.activeRules?.includes(rule.id);if(yes){out[rule.kind]=c.type;notes.push(rule.label);}}
  const override=c.overrides?.[t.id];if(override&&override!=='auto'){for(const key of Object.keys(out))out[key]='';if(override!=='none')out[override]=c.type;notes.push(`DM override: ${override}`);ambiguous.length=0;}
  return {record:out,notes,ambiguous};
 }
 function damagePreview(s,job){if(own(s).pauses.some(p=>p.scene===s.scene&&p.status==='open')&&!job.reactionDamage)throw Error('Damage is paused for reactions. Resolve the window first.');if(job.scene!==s.scene)throw Error('Return to the damage scene or cancel this staged damage.');if(!job.targets?.length||!job.components?.length)throw Error('Choose targets and at least one damage component.');if(job.pauseId&&own(s).pauses.find(p=>p.id===job.pauseId)?.status!=='closed'&&!job.reactionDamage)throw Error('Damage is paused for reactions.');const batch=job.saveBatchId?own(s).saves.find(b=>b.id===job.saveBatchId):null;if(job.saveBatchId&&!batch)throw Error('Save batch is unavailable.');
  const results=[];for(const tid of job.targets){const live=token(s,tid);if(!live||!Number.isFinite(live.hp))throw Error('Confirm target HP.');let t=clone(live),hit=true,ratio=1;const rows=[];
   if(job.attack){const ac=Number(live.ac)+Number(job.attack.cover||0)+Number(job.attack.acBonus||0);if(live.ac===null||!Number.isFinite(ac))throw Error('Confirm target AC.');hit=job.attack.natural!==1&&(job.attack.natural>=Number(job.attack.crit||20)||job.attack.total>=ac);}
   if(batch){const result=batch.targets.find(r=>r.id===tid);if(!result||!['passed','failed'].includes(result.status))throw Error('Collect or enter every selected target’s saving throw first.');if(result.status==='passed')ratio=job.success==='half'?.5:0;}
   let total=0;for(const c of job.components){if(!types.includes(c.type)||!Number.isFinite(Number(c.amount))||c.amount<0||c.amount>999)throw Error('Choose a damage type and amount from 0–999 for every component.');const d=defense(s,t,c);if(d.ambiguous.length)throw Error(`${t.name}: clarify conditional defenses with an explicit override (${d.ambiguous.join('; ')}).`);const amount=hit?Math.floor(Number(c.amount)*ratio):0,result=globalThis.ECHO_COMBAT_DATA.damagePreview(t,amount,c.type,'damage',d.record);rows.push({type:c.type,amount,adjusted:result.adjusted,tempUsed:result.tempUsed,notes:d.notes});t.hp=result.hp;t.tempHp=result.tempHp;total+=result.adjusted;}
   results.push({id:tid,name:t.name,hp:t.hp,tempHp:t.tempHp,before:live.hp,rows,total,hit});
  }return results;
 }
 const damageSignature=(s,job)=>JSON.stringify({job,tokens:s.tokens,combat:s.combat,saves:own(s).saves,pauses:own(s).pauses,defenses:own(s).defenses,turn:s.turn,queue:s.combatRun.queue});
 function applyDamage(s,job,signature){if(signature!==damageSignature(s,job))throw Error('The table changed. Preview damage again.');if(job.status!=='staged')throw Error('This damage has already been resolved.');if(!job.reactionsChecked)throw Error('Confirm reactions before applying damage.');if(job.reactionDamage&&(!job.actorId||s.combat.tokens[job.actorId]?.reactionUsed))throw Error('Choose a reacting creature with an available reaction.');const results=damagePreview(s,job),next=clone(s);for(const r of results){const t=token(next,r.id);t.hp=r.hp;t.tempHp=r.tempHp;if(next.party[r.id]){next.party[r.id].hp=r.hp;next.party[r.id].tempHp=r.tempHp;}
   const concentration=next.combat.tokens[r.id]?.concentration;if(concentration&&r.total>0){if(r.hp===0){next.combat.tokens[r.id].concentration='';t.conditions=t.conditions.filter(c=>c!=='Concentrating');if(next.party[r.id])next.party[r.id].concentration='';}else reminder(next,{id:job.id,name:'Concentration',note:`CON save DC ${Math.max(10,Math.floor(r.total/2))}; one damage event with ${job.components.length} component(s).`},t,'damage');}
  }
  if(job.reactionDamage){next.combat.tokens[job.actorId]||=globalThis.ECHO_COMBAT_DATA.creatureDefense(token(next,job.actorId)?.type);next.combat.tokens[job.actorId].reactionUsed=true;}
  if(!job.reactionDamage&&job.actorId&&next.turn.scene===next.scene&&next.turn.order[next.turn.index]===job.actorId){const q=next.combatRun.queue;q.actionUsed=true;if(Number.isInteger(job.attack?.step)&&job.attack.step>=0)q.done[job.attack.step]=true;}
  const saved=own(next).damage.find(j=>j.id===job.id);if(saved){saved.status='resolved';saved.results=results;}return next;
 }
 function shield(s,tid,poolId){const t=token(s,tid),sh=s.party[tid],pool=sh?.resources.find(p=>p.id===poolId);if(!t||!sh||![...(sh.spells||[]),...(sh.actions||[])].some(a=>/^shield(?:\s*\([^)]*\))?$/i.test(a.name)&&a.prepared!==false))throw Error('Shield is not listed on this character’s sheet.');if(!pool||pool.current<1||!/slot/i.test(pool.name))throw Error('Choose an available spell-slot pool.');if(s.combat.tokens[tid]?.reactionUsed)throw Error('That reaction is already used.');if(own(s).acEffects.some(e=>e.active&&e.tokenId===tid))throw Error('Shield is already active.');if(!Number.isFinite(t.ac))throw Error('Set the character’s AC first.');
  pool.current--;s.combat.tokens[tid]||=globalThis.ECHO_COMBAT_DATA.creatureDefense(t.type);s.combat.tokens[tid].reactionUsed=true;const e={id:id(),tokenId:tid,base:t.ac,after:t.ac+5,active:true};own(s).acEffects.push(e);t.ac=e.after;sh.ac=e.after;return e;
 }
 function turnPoint(s,tid,point){for(const e of own(s).acEffects)if(e.active&&e.tokenId===tid&&point==='start'){const t=token(s,tid);if(t.ac===e.after){t.ac=e.base;if(s.party[tid])s.party[tid].ac=e.base;}else reminder(s,{id:e.id,name:'Shield expiry',note:'AC changed while Shield was active. Remove its +5 manually without overwriting other changes.'},t,'expiry');e.active=false;}
  for(const a of own(s).areas.filter(a=>a.active&&a.scene===s.scene)){const t=token(s,tid);if(t&&globalThis.ECHO_COMBAT_DATA.inShape(a.shape,t)&&a.triggers.includes(point))reminder(s,a,t,point);
   if(a.anchor===tid&&a.tick===point&&a.remaining!==null&&a.lastTick!==`${turnKey(s)}:${point}`){a.lastTick=`${turnKey(s)}:${point}`;a.remaining=Math.max(0,a.remaining-1);if(!a.remaining){a.active=false;reminder(s,a,t,'expiry','Duration finished. Review any lingering conditions.');}}}
 }
 function syncAreas(s){for(const a of own(s).areas)if(a.active&&a.concentration&&s.combat.tokens[a.owner]?.concentration!==a.concentration){a.active=false;const t=token(s,a.owner);if(t)reminder(s,a,t,'ended','Concentration ended or changed. Review lingering conditions.');}}
 function trigger(s,eventId){const e=own(s).events.find(e=>e.id===eventId);if(!e||e.scene!==s.scene||e.done&&!e.repeatable)throw Error('This event is unavailable or already triggered.');for(const tid of e.reveal||[]){const t=token(s,tid);if(t&&t.scene===s.scene){t.placed=true;t.visible=true;}}for(const aid of e.areas||[]){const a=own(s).areas.find(a=>a.id===aid);if(a)a.active=true;}if(e.boss)own(s).phases[e.boss]=e.name;e.done=true;e.count=(e.count||0)+1;own(s).reminders.push({id:id(),key:id(),scene:s.scene,title:`${e.kind}: ${e.name}`,text:e.note,done:false});return e;}
 globalThis.ECHO_COMBAT_PLUS={normalize,own,id,scale,distance,speed,suggest,movementPreview,applyMovement,placeToken,saveBatch,saveResult,pause,reactionReply,phone,defense,damagePreview,damageSignature,applyDamage,shield,turnPoint,syncAreas,trigger,types};
})();

/* Staged character changes. Nothing here mutates the live party. */
(() => {
 'use strict';
 const D=()=>globalThis.ECHO_PARTY_DATA, clone=x=>structuredClone(x), signature=x=>JSON.stringify(x);
 const groups={identity:['name','player','className','ancestry','background','level','rules','source','sourceStatus'],stats:['abilities','saves','skills','proficiency','speed','senses','languages','ac','maxHp','passiveOverride'],status:['hp','tempHp','inspiration','death','exhaustion','conditions','concentration','effects'],hitDice:['hitDice'],actions:['attacks','actions'],spells:['spells'],resources:['resources'],features:['features'],gear:['equipment','money'],notes:['notes','publicNotes'],preferences:['management','publicOptions']};
 const key=(type,item)=>`${type}:${item.id||item.name}`;
 const entries=s=>[['attack',s.attacks],['action',s.actions],['spell',s.spells]].flatMap(([type,list])=>(list||[]).map((item,index)=>({type,index,item,key:key(type,item)})));
 function pools(s){
  if(s.hitDice.pools?.length)return clone(s.hitDice.pools);
  const found=[...(s.hitDice.details||'').matchAll(/(\d+)d(6|8|10|12)\b/g)];
  if(found.length>1){const result=found.map(m=>({die:+m[2],max:+m[1],current:s.hitDice.current===s.hitDice.max?+m[1]:null}));if(result.reduce((n,p)=>n+p.max,0)===s.hitDice.max)return result;}
  return [{die:s.hitDice.die,max:s.hitDice.max,current:s.hitDice.current}];
 }
 function setPools(s,list){
  if(!list.length||list.some(p=>![6,8,10,12].includes(+p.die)||!Number.isInteger(p.max)||!Number.isInteger(p.current)||p.max<0||p.current<0||p.current>p.max))throw Error('Confirm the available and maximum Hit Dice in every pool.');
  s.hitDice={die:list[0].die,current:list.reduce((n,p)=>n+p.current,0),max:list.reduce((n,p)=>n+p.max,0),details:list.map(p=>`${p.max}d${p.die}`).join(' + '),pools:clone(list)};
 }
 function diff(a,b){return Object.entries(groups).map(([group,fields])=>({group,changes:fields.filter(k=>signature(a[k])!==signature(b[k])).map(field=>({field,before:a[field],after:b[field]}))})).filter(g=>g.changes.length);}
 function validateSheet(s){
  if(s.hp!==null&&s.maxHp!==null&&s.hp>s.maxHp)throw Error('Current HP cannot exceed maximum HP.');
  for(const r of s.resources)if(r.current!==null&&r.max!==null&&r.current>r.max)throw Error(`${r.name}: available uses cannot exceed the maximum.`);
  if(s.hitDice.current!==null&&s.hitDice.max!==null&&s.hitDice.current>s.hitDice.max)throw Error('Available Hit Dice cannot exceed the maximum.');
 }
 function stage(s,next,label){validateSheet(next);return {id:s.id,base:signature(s),before:clone(s),after:D().normalizeSheet({...next,id:s.id},s),label};}
 function apply(party,review){if(!party[review.id]||signature(party[review.id])!==review.base)throw Error('The live sheet changed. Build a new preview before applying.');return clone(review.after);}
 function archive(s,next,summary){const prior=clone(s);prior.levelHistory=[];next.levelHistory=[...(s.levelHistory||[]),{date:new Date().toISOString(),level:next.level,summary,snapshot:prior}].slice(-30);}
 function imported(s,input,selected=Object.keys(groups),keepLive=true){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Choose an exported character sheet.');
  const normalized=D().normalizeSheet({...input,id:s.id},s),next=clone(s);
  for(const group of selected)for(const field of groups[group]||[])next[field]=clone(normalized[field]);
  if(keepLive){for(const field of groups.status)next[field]=clone(s[field]);next.hp=next.maxHp==null?s.hp:Math.min(s.hp??0,next.maxHp);for(const r of next.resources){const old=s.resources.find(x=>x.id===r.id);if(old)r.current=Math.min(old.current??0,r.max??999);}if(s.hitDice.max===next.hitDice.max)next.hitDice=clone(s.hitDice);}
  archive(s,next,'Imported replacement sheet after difference review');return stage(s,next,'Import character sheet');
 }
 function level(s,options){
  if(!Number.isInteger(s.level)||s.level<1||s.level>=20)throw Error('Guided advancement supports a confirmed level from 1 through 19.');
  const next=clone(options.draft||s),die=+options.die,roll=+options.hpRoll;
  if(![6,8,10,12].includes(die)||!Number.isInteger(roll)||roll<1||roll>die)throw Error('Enter a valid HP die result or choose the fixed value.');
  if(!options.className?.trim())throw Error('Record the class and its new level.');
  const con=D().abilityMod(next.abilities.con),oldCon=D().abilityMod(s.abilities.con);
  if(con===null||oldCon===null||s.maxHp===null)throw Error('Confirm Constitution and maximum HP before advancing.');
  next.level=s.level+1;next.className=options.className;next.proficiency=D().proficiencyForLevel(next.level);
  const gain=Math.max(1,roll+con)+(con-oldCon)*s.level;
  next.maxHp=Math.max(next.level,s.maxHp+gain);next.hp=options.healFull?next.maxHp:Math.max(0,Math.min(next.maxHp,(s.hp??0)+(next.maxHp-s.maxHp)));
  const list=clone(options.pools||pools(s));setPools(clone(s),list);
  if(list.reduce((n,p)=>n+p.max,0)!==s.hitDice.max||list.reduce((n,p)=>n+p.current,0)!==s.hitDice.current)throw Error('Hit Die pool totals must match the current sheet before adding the new die.');
  let pool=list.find(p=>p.die===die);if(!pool){pool={die,max:0,current:0};list.push(pool);}pool.max++;pool.current++;setPools(next,list);
  const summary=`Level ${next.level}: ${options.summary||'Reviewed advancement'}; HP die ${roll} (d${die}), CON ${con}, maximum HP ${s.maxHp} → ${next.maxHp}`;
  archive(s,next,summary);return stage(s,next,summary);
 }
 function rest(s,kind,options={}){
  const list=clone(options.pools||pools(s));setPools(clone(s),list);
  if(list.reduce((n,p)=>n+p.max,0)!==s.hitDice.max||list.reduce((n,p)=>n+p.current,0)!==s.hitDice.current)throw Error(`${s.name}: Hit Die pool totals must match the current sheet.`);
  const spend=options.dice||{},recover=options.recover||{};
  let spent=0,regained=0;
  for(const [i,p]of list.entries()){
   const n=Number((kind==='short'?spend:recover)[i]||0);
   if(!Number.isInteger(n)||n<0||n>(kind==='short'?p.current:p.max-p.current))throw Error(`${s.name}: choose available Hit Dice only.`);
   if(kind==='short'){p.current-=n;spent+=n;}else{p.current+=n;regained+=n;}
  }
  const limit=s.rules.startsWith('2024')?s.hitDice.max:Math.max(1,Math.floor(s.hitDice.max/2));
  if(kind==='long'&&regained>limit&&!options.exception?.trim())throw Error(`${s.name}: too many Hit Dice recovered; record an exceptional recovery ruling.`);
  const healing=Number(options.healing||0);if(!Number.isFinite(healing)||healing<0||healing>999||kind==='short'&&healing>0&&!spent&&!options.exception?.trim())throw Error('Healing without Hit Dice needs an exceptional recovery note.');
  const result=D().previewRest(s,kind,{...options,hitDiceSpent:spent,healing,restoreHitDice:false});if(result.blocked)throw Error(`${s.name}: ${result.blocked}`);
  setPools(result.sheet,list);
  for(const [id,value]of Object.entries(options.resourceOverrides||{})){const r=result.sheet.resources.find(x=>x.id===id);if(!r||!Number.isInteger(value)||value<0||value>(r.max??0))throw Error('Recovery overrides must fit the resource maximum.');if(!options.exception?.trim())throw Error('Record the feature or ruling for exceptional recovery.');r.current=value;}
  if(options.overrideAtZero&&!options.exception?.trim())throw Error('Record the reason for overriding rest eligibility.');
  if(options.exception?.trim())result.sheet.notes=`${s.notes||''}\nRest ${new Date().toISOString().slice(0,10)}: ${options.exception}`.slice(-3000);
  return stage(s,result.sheet,`${kind} rest${options.exception?': '+options.exception:''}`);
 }
 function rollHealing(s,options,rng=die=>Math.floor(Math.random()*die)+1){const con=D().abilityMod(s.abilities.con);if(con===null)throw Error('Confirm Constitution before rolling Hit Dice.');let total=0;const rolls=[];for(const [i,p]of options.pools.entries()){const n=Number(options.dice[i]||0);if(!Number.isInteger(n)||n<0||n>p.current)throw Error('Choose available Hit Dice.');for(let j=0;j<n;j++){const roll=rng(p.die);rolls.push(`d${p.die}: ${roll} ${con<0?'−':'+'} ${Math.abs(con)}`);total+=Math.max(0,roll+con);}}return {total,rolls};}
 const slotLevel=r=>Number(r.slotLevel)||Number((r.name||'').match(/([1-9])(?:st|nd|rd|th)[- ]level.*(?:spell )?slots?/i)?.[1])||0;
 globalThis.ECHO_CHARACTER_TOOLS={groups,key,entries,pools,setPools,diff,stage,apply,imported,level,rest,rollHealing,slotLevel,signature};
})();

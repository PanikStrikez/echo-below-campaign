(() => {
 'use strict';let host,selected='',plan=null,review=null,revision=0,rollCache={};const drafts=new Map(),expanded=new Set();
 const api=()=>globalThis.ECHO_PHONE_ACTIONS;
 function open(id){if(selected!==(id||'')){if(selected&&plan)drafts.set(selected,{plan,revision,rollCache});const old=drafts.get(id);plan=old?.plan||null;revision=old?.revision||0;rollCache=old?.rollCache||{};review=null;if(drafts.size>200)drafts.delete(drafts.keys().next().value);}selected=id||'';host.show();render();}
 function render(){if(!host)return;const root=host.root();if(!root)return;root.replaceChildren();
  const s=host.state(),requests=api().data(s).requests;
  const el=(tag,text,parent)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;parent.append(n);return n;};
  const btn=(p,title,fn)=>{const b=el('button',title,p);b.type='button';b.addEventListener('click',()=>{try{fn();}catch(e){host.toast(e.message);}});return b;};
  const field=(p,title,value,fn,multi=false)=>{const l=el('label',title,p),i=el(multi?'textarea':'input',null,l);i.value=value??'';if(multi)i.rows=3;i.addEventListener('change',()=>{fn(i.value);review=null;render();});return i;};
  const select=(p,title,value,options,fn)=>{const l=el('label',title,p),i=el('select',null,l);for(const [id,label]of options){const o=el('option',label,i);o.value=id;}i.value=value;i.addEventListener('change',()=>{fn(i.value);review=null;render();});return i;};
  const check=(p,title,value,fn)=>{const l=el('label',null,p),i=el('input',null,l);i.type='checkbox';i.checked=value;el('span',title,l);i.addEventListener('change',()=>{fn(i.checked);review=null;render();});};
  el('h3','Phone actions',root);el('p','Review once, then apply the rolls, costs, concentration, action usage, and selected effects together. All preview rolls stay private until resolution.',root);
  const waiting=requests.filter(api().pending);
  for(const r of waiting){const b=btn(root,`${s.party[r.characterId]?.name||'Player'} · ${r.label} · ${r.status}`,()=>open(r.id));b.className='request-row';}
  const history=el('details',null,root);el('summary',`History · ${requests.filter(r=>!api().pending(r)).length}`,history);
  for(const r of requests.filter(r=>!api().pending(r)).slice().reverse().slice(0,60)){
   const box=el('article',null,history);el('h4',`${s.party[r.characterId]?.name||'Player'} · ${r.label} · ${r.status}`,box);
   el('p',r.message,box);if(r.resolution){el('p',`Usage: ${r.resolution.plan.usage} · concentration: ${r.resolution.plan.concentration} · ${r.resolution.plan.effectNote}`,box);el('p',`Costs/recovery: ${r.resolution.plan.costs.map(c=>`${c.id} ${c.delta>0?'+':''}${c.delta}`).join(', ')||'none'}`,box);for(const row of r.resolution.rolls||[])el('p',`${row.label}: ${row.notation} = ${row.total}`,box);}
   el('small',r.transitions.map(t=>`${t.status} ${t.at}`).join(' → '),box);
   if(r.status==='resolved')btn(box,'Undo this resolution',()=>host.undo(r.id));
  }
  const r=requests.find(r=>r.id===selected);if(!r||!api().pending(r)){if(!waiting.length)el('p','No actions waiting.',root);return;}
  if(review&&review.signature!==api().fingerprint(s,r)){review=null;el('p','The table changed. Review the updated values and prepare again.',root);}
  if(!plan||revision!==r.revision){try{plan=api().initialPlan(s,r);revision=r.revision;review=null;rollCache={};}catch(error){el('p',`${r.label}: ${error.message} Ask the player to revise this request.`,root);btn(root,'Request clarification',()=>host.status(r.id,'needs clarification',error.message));btn(root,'Decline unavailable request',()=>host.status(r.id,'declined',error.message));return;}}
  el('p','Choose action → Target → Roll → Reactions → Damage / effects → Done · '+(review?'Review reactions and final changes':'Confirm targets and costs, then prepare rolls'),root).className='combat-flow-steps';el('h3',`${s.party[r.characterId].name}: ${r.label}`,root);el('p',`Requested targets: ${r.targetNames.join(', ')||'No token target; review the player’s note.'}`,root);el('p',`Player note: ${r.note||'None'}`,root);el('p',r.message,root);
  const controls=el('div',null,root);
  btn(controls,'Needs clarification',()=>{const message=prompt('What does the player need to clarify?',r.message||'Choose targets and describe the intended effect.');if(message?.trim())host.status(r.id,'needs clarification',message);});
  btn(controls,'Decline',()=>{const message=prompt('Reason to show the player:','Not available right now.');if(message!==null)host.status(r.id,'declined',message);});
  const compact=globalThis.ECHO_GUIDED?.enabled()&&r.actionType==='attack';
  const disclosure=(node,key)=>{node.open=expanded.has(key);node.ontoggle=()=>{node.open?expanded.add(key):expanded.delete(key);};};
  if(compact){el('p',`Uses: ${plan.usage}. Resources: ${plan.costs.map(c=>(s.party[r.characterId].resources.find(p=>p.id===c.id)?.name||c.id)+' '+c.delta).join(', ')||'none'}. Concentration: ${plan.concentration==='set'?plan.concentrationName:plan.concentration}.`,root);if(plan.effectNote)el('p',plan.effectNote,root);}
  const settings=el(compact?'details':'section',null,root);el(compact?'summary':'h4','Timing, cost, and effect',settings);if(compact)disclosure(settings,r.id+':settings');
  select(settings,'Use',plan.usage,[['action','Action'],['bonus','Bonus action'],['reaction','Reaction'],['none','No action / ritual / downtime']],v=>plan.usage=v);
  field(settings,'Ruling / override reason',plan.override,v=>plan.override=v,true);
  const pools=s.party[r.characterId].resources||[];
  for(const pool of pools){const cost=plan.costs.find(c=>c.id===pool.id);const i=field(settings,`${pool.name}: ${pool.current}/${pool.max} · change (negative spends, positive restores)`,cost?.delta||0,v=>{plan.costs=plan.costs.filter(c=>c.id!==pool.id);if(Number(v)!==0)plan.costs.push({id:pool.id,delta:Number(v)});});i.type='number';}
  select(settings,`Concentration (currently ${s.party[r.characterId].concentration||'none'})`,plan.concentration,[['keep','Keep current'],['set','Replace with new effect'],['end','End concentration']],v=>plan.concentration=v);
  if(plan.concentration==='set')field(settings,'New concentration',plan.concentrationName,v=>plan.concentrationName=v);
  check(settings,'Grant one additional action now (e.g. Action Surge)',plan.grantAction,v=>plan.grantAction=v);
  field(settings,'Full effect / duration / follow-up ruling',plan.effectNote,v=>plan.effectNote=v,true);
  el('p','Add one step per attack, dart, save, healing target, or condition. Review multiattack counts, range, cover, damage type, defenses, slot level, concentration, reaction triggers, and any later expiry. Effects such as AC changes must have a stated duration; recorded follow-up reminders remain under DM control.',settings);
  const visible=host.visible(),targets=s.tokens.filter(t=>t.id===r.characterId||visible.includes(t.id)).map(t=>[t.id,t.name]);
  for(const [index,step]of plan.steps.entries()){
   const box=el('details',null,root);box.open=true;if(compact)disclosure(box,r.id+':step:'+index);el('summary',`Step ${index+1} · ${s.tokens.find(t=>t.id===step.targetId)?.name||'Choose target'}`,box);
   if(compact)el('p',`${s.tokens.find(t=>t.id===step.targetId)?.name||'Target'}: ${step.kind} ${step.bonus>=0?'+':''}${step.bonus} · ${step.mode} · AC ${step.ac!==''?step.ac:s.tokens.find(t=>t.id===step.targetId)?.ac??'unknown'} · cover ${step.cover} · ${step.manual!==''?step.manual:step.notation} ${step.damageType}${step.condition?' · '+step.condition:''}. Expand the step to adjust.`,root);
   select(box,'Target',step.targetId,targets,v=>step.targetId=v);
   select(box,'Resolution',step.kind,['attack','save','damage','heal','effect','roll'].map(x=>[x,x]),v=>step.kind=v);
   field(box,'Damage / healing / effect dice (blank for no roll)',step.notation,v=>step.notation=v);
   field(box,'Shared dice group (same name reuses one damage roll)',step.sharedRoll||'',v=>step.sharedRoll=v);
   field(box,'Damage type',step.damageType,v=>step.damageType=v);
   if(step.kind==='attack'){field(box,'Attack modifier',step.bonus,v=>step.bonus=Number(v)).type='number';select(box,'Cover',String(step.cover),[['0','None'],['2','Half (+2 AC)'],['5','Three-quarters (+5 AC)'],['full','Full cover']],v=>step.cover=v);field(box,'AC override (blank uses target AC + cover)',step.ac,v=>step.ac=v).type='number';field(box,'Critical range starts at',step.crit,v=>step.crit=Number(v)).type='number';}
   if(step.kind==='save'){select(box,'Collected phone saves (optional)',step.saveBatchId||'',[['','Roll in this review'],...(s.combatPlus?.saves||[]).filter(b=>b.scene===s.scene).map(b=>[b.id,b.label])],v=>step.saveBatchId=v);select(box,'Save ability',step.saveAbility,['STR','DEX','CON','INT','WIS','CHA'].map(x=>[x,x]),v=>step.saveAbility=v);field(box,'Save DC',step.dc,v=>step.dc=Number(v)).type='number';select(box,'Damage on success',step.success,[['none','None'],['half','Half']],v=>step.success=v);}
   if(['attack','save'].includes(step.kind)&&globalThis.ECHO_COMBAT_PLUS){const a=s.tokens.find(t=>t.id===r.characterId),t=s.tokens.find(t=>t.id===step.targetId);const guide=globalThis.ECHO_COMBAT_PLUS.suggest(s,step.kind==='attack'?r.characterId:step.targetId,step.targetId,step.kind==='attack'?'attack':'save',step.saveAbility.toLowerCase(),a&&t?(host.distance?host.distance(a,t):globalThis.ECHO_COMBAT_PLUS.distance(a,t,globalThis.ECHO_COMBAT_PLUS.scale(s))):null);el('p',`${[...guide.yes,...guide.no,...guide.notes].join(' ')} Suggested: ${guide.mode}; use the selector to override.`,box);}
   if(['attack','save'].includes(step.kind))select(box,'D20 mode',step.mode,['normal','advantage','disadvantage'].map(x=>[x,x]),v=>step.mode=v);
   if(s.combat.tokens[step.targetId]?.concentration)select(box,'Concentration save mode if damaged',step.concentrationMode||'normal',['normal','advantage','disadvantage'].map(x=>[x,x]),v=>step.concentrationMode=v);
   field(box,'Final base damage/healing override (before defenses; blank uses dice)',step.manual,v=>step.manual=v).type='number';
   select(box,'Apply condition',step.condition,[['','None'],...host.conditions().filter(x=>x!=='Concentrating').map(x=>[x,x])],v=>step.condition=v);
   if(step.condition)select(box,'Condition timing',step.conditionWhen,[['always','Apply'],['hit','Only on hit / failed save']],v=>step.conditionWhen=v);
   field(box,'Set AC (blank leaves unchanged)',step.acSet,v=>step.acSet=v).type='number';
   btn(box,'Duplicate step',()=>{plan.steps.splice(index+1,0,structuredClone(step));review=null;render();});btn(box,'Remove step',()=>{plan.steps.splice(index,1);review=null;render();});
  }
  btn(root,'Add effect / roll step',()=>{plan.steps.push({targetId:r.targetIds[0]||r.characterId,kind:'effect',notation:'',bonus:0,mode:'normal',damageType:'',saveAbility:'DEX',dc:10,success:'none',cover:0,ac:'',condition:'',conditionWhen:'always',acSet:'',manual:'',crit:20});review=null;render();});
  check(root,'I checked the targets, timing, full effect, costs, and any exceptions',plan.acknowledged,v=>plan.acknowledged=v);
  btn(root,'Prepare rolls & preview',()=>{review=host.prepare(r.id,plan,rollCache);render();}).disabled=!!review;
  if(review&&host.pause)btn(root,'Pause for reactions; keep these rolls',()=>host.pause(r));
  if(review){const box=el('section',null,root);el('h3','Review before applying',box);
   for(const roll of review.rolls)el('p',`${roll.label}: ${roll.notation} [${roll.parts.join(', ')}] = ${roll.total}${roll.public?'':' · DM private'}`,box);
   for(const result of review.outcomes)el('p',result.text,box);
   for(const p of review.patches)el('p',`${s.tokens.find(t=>t.id===p.id)?.name||'Turn'} · ${p.kind==='resource'?(pools.find(x=>x.id===p.field)?.name||p.field):p.field||'usage'}: ${JSON.stringify(p.before)} → ${JSON.stringify(p.after)}`,box);
   for(const effect of review.effects)el('p',`Reminder: ${effect.name}`,box);
   btn(box,'Approve & resolve together',()=>{host.resolve(review);review=null;plan=null;render();}).className='primary';
  }
 }
 globalThis.ECHO_PHONE_ACTIONS_UI={init:value=>host=value,open,render,addTarget:id=>{if(!plan){host.toast('Open a waiting action first.');return;}if(!plan.steps.some(p=>p.targetId===id)){const base=plan.steps[0]||{kind:'effect',notation:'',bonus:0,mode:'normal',damageType:'',saveAbility:'DEX',dc:10,success:'none',cover:0,ac:'',condition:'',conditionWhen:'always',acSet:'',manual:'',crit:20};plan.steps.push({...structuredClone(base),targetId:id});}review=null;render();}};
})();

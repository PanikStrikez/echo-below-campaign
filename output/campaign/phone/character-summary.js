/* Shared renderer: accepts the player-safe ownerView, never the private sheet. */
(() => {
 'use strict';
 const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sign=n=>Number.isFinite(n)?`${n>=0?'+':''}${n}`:'—';
 function html(c,options={}){
  const section=(title,rows)=>rows.length?`<section><h2>${esc(title)}</h2>${rows.map(r=>`<p>${esc(r)}</p>`).join('')}</section>`:'';
  const actions=[...(c.attacks||[]),...(c.actions||[])].map(a=>[a.name,a.type,a.prepared===false?'Unavailable':'',Number.isFinite(a.attackBonus)?`Attack ${sign(a.attackBonus)}`:'',a.damageDice?`${a.damageDice} ${a.damageType||''}`:'',a.saveDC?`${a.saveAbility} DC ${a.saveDC}`:'',a.resourceId?`Cost ${a.cost??1} ${(c.resources||[]).find(r=>r.id===a.resourceId)?.name||'resource'}`:'',a.effect,a.support?.label,a.support?.reason].filter(Boolean).join(' · '));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.name)} · Character handout</title><style>body{font:15px/1.5 Georgia,serif;color:#24241d;background:#fffdf7;max-width:850px;padding:24px;margin:auto}h1,h2{color:#423d25}h2{border-bottom:1px solid #b4a67d}p{white-space:pre-wrap;overflow-wrap:anywhere}section{margin:18px 0}section p{break-inside:avoid}h2{break-after:avoid}small{color:#605e50}@media print{body{padding:0;background:white;font-size:11pt}h1{font-size:22pt}h2{font-size:15pt}@page{margin:17mm}}</style></head><body><h1>${esc(c.name)}</h1><p>${esc(c.player)} · ${esc(c.ancestry)} · ${esc(c.className)} · Level ${esc(c.level)}</p><p>${esc(c.rules)} · ${esc(c.background)}</p><small>Snapshot ${esc(new Date(options.updatedAt||Date.now()).toLocaleString())}. Current values may change during play. Print / Save as PDF from your browser.</small>
  ${/^https?:\/\//.test(options.reconnectUrl||'')?`<p><a href="${esc(options.reconnectUrl)}">Reconnect to the live table</a> · Join the table Wi-Fi first. If access was restarted, scan the new QR code. This downloaded copy stays unchanged.</p>`:''}
  ${section('Current status',[`HP ${c.hp??'?'}/${c.maxHp??'?'} · Temporary HP ${c.tempHp||0} · AC ${c.ac??'?'} · Speed ${c.speed??'?'} ft · Proficiency ${sign(c.proficiency)}`,`Hit Dice: ${c.hitDice?.current??'?'}/${c.hitDice?.max??'?'} · ${c.hitDice?.details||'d'+(c.hitDice?.die??'?')}`,...(c.hitDice?.pools||[]).map(p=>`d${p.die}: ${p.current??'?'}/${p.max??'?'}`),`Inspiration: ${c.inspiration?'yes':'no'} · Exhaustion ${c.exhaustion||0}`,`Conditions: ${(c.conditions||[]).join(', ')||'none'} · Concentration: ${c.concentration||'none'}`,`Death saves: ${c.death?.successes||0} successes / ${c.death?.failures||0} failures${c.death?.stable?' · stable':''}`,...(c.effects||[]).map(e=>`${e.name}: ${e.remaining||''} ${e.timing||''} ${e.note||''}`)])}
  ${section('Abilities and saves',[...Object.entries(c.abilities||{}).map(([k,v])=>`${k.toUpperCase()} ${v.score??'?'} (${sign(v.modifier)})`),...(c.saves||[]).map(v=>`${v.name} save ${sign(v.bonus)}`)])}
  ${section('Skills, senses and languages',[...(c.skills||[]).map(v=>`${v.name} ${sign(v.bonus)}${v.rank===2?' · Expertise':''}`),...Object.entries(c.passives||{}).map(([k,v])=>`Passive ${k}: ${v??'?'}`),`Senses: ${c.senses||'—'}`,`Languages: ${c.languages||'—'}`])}
  ${section('Attacks and abilities',actions)}
  ${section('Spells',(c.spells||[]).map(s=>`${s.name} · ${s.level===0?'cantrip':'level '+s.level} · ${s.prepared===true?'available':s.prepared===false?'not prepared':'preparation unconfirmed'}${s.notes?' — '+s.notes:''}`))}
  ${section('Resources',(c.resources||[]).map(r=>`${r.name}: ${r.current??'?'}/${r.max??'?'} ${r.unit||''}`))}
  ${section('Equipment and money',[...(c.equipment||[]).map(e=>`${e.quantity} × ${e.name}${e.attuned?' · attuned':''}${e.equipped?' · equipped':''}${e.notes?' — '+e.notes:''}`),Object.entries(c.money||{}).map(([coin,n])=>`${n} ${coin}`).join(' · ')])}
  ${section('Features',(c.features||[]).map(f=>`${f.name}: ${f.text||''}${f.source?' ('+f.source+')':''}`))}
  ${section('Character notes',c.publicNotes?[c.publicNotes]:[])}
  </body></html>`;
 }
 globalThis.ECHO_CHARACTER_SUMMARY={html};
})();

/* Shared action receipts travel with this already-served, audience-neutral helper.
   Builders project approved records; render() never reads campaign state. */
(()=>{'use strict';
 const text=v=>String(v??'').slice(0,1600),list=v=>(Array.isArray(v)?v:[]).map(text).filter(Boolean).slice(0,25);
 const labels={resolved:'Resolved',waiting:'Waiting for DM',approved:'Approved · not resolved',unresolved:'Unresolved','needs clarification':'Needs a ruling / reply',declined:'Declined',cancelled:'Cancelled',failed:'Failed',undone:'Undone'};
 function model(x={}){const status=labels[x.status]?x.status:'unresolved';return {id:text(x.id),title:text(x.title)||'Action result',status,committed:status==='resolved'?[...new Set(list(x.committed))]:[],pending:list(x.pending),details:list(x.details),undo:status==='resolved'&&['available','ask-dm','conditional'].includes(x.undo)?x.undo:'unavailable'};}
 function combat(r,s,owner=''){
  if(owner&&r.characterId!==owner)return null;
  const res=r.resolution,player=!!owner,committed=[],details=[],pending=[];
  if(r.status==='resolved'&&res){for(const p of res.patches||[]){if(player&&p.id!==owner)continue;if(['resource','npcResource'].includes(p.kind)){const name=s.party?.[p.id]?.resources?.find(v=>v.id===p.field)?.name||p.field;committed.push(`${name}: ${p.before} → ${p.after}`);}else if(['hp','tempHp','ac','conditions','concentration','reactionUsed'].includes(p.field)){const name=player?'You':s.tokens?.find(t=>t.id===p.id)?.name||'Combatant';committed.push(`${name} · ${p.field}: ${Array.isArray(p.before)?p.before.join(', '):p.before??'none'} → ${Array.isArray(p.after)?p.after.join(', '):p.after??'none'}`);}}
   const queue=(res.patches||[]).find(p=>p.kind==='queue');if(queue&&res.plan?.usage==='action'&&queue.after?.actionUsed)committed.push('Turn action marked spent');if(queue&&res.plan?.usage==='bonus'&&queue.after?.bonusUsed)committed.push('Bonus action marked spent');
   if(!player){committed.push(...(res.outcomes||[]).map(o=>o.text));details.push(res.plan?.effectNote,...(res.rolls||[]).map(v=>`${v.label}: ${v.notation} = ${v.total}`),r.entry?.source||s.party?.[r.characterId]?.source||'Reviewed action record');}
   else {committed.push(r.message||'Effect resolved by DM');details.push(...(res.rolls||[]).filter(v=>v.public).map(v=>`${v.label}: ${v.notation} = ${v.total}`));}
   if((res.effects||[]).some(e=>e.due||e.repeatSave))pending.push('Follow-up reminder recorded; further saves or rulings are not automatic.');
   if(res.plan?.steps?.some(v=>v.kind==='effect'))pending.push('Narrated effects remain DM-managed; only the changes listed here were applied.');
  }else if(r.status==='resolved'){committed.push('Resolution recorded; detailed changes unavailable.');pending.push('Verify the current sheet or ask the DM before applying anything again.');}else pending.push(r.message||'No effects committed.');
  return model({id:r.id,title:r.label,status:r.status,committed,pending,details,undo:player?'ask-dm':'conditional'});
 }
 function inventory(r){return model({id:r.id,title:[r.verb,r.name||r.expected?.name].filter(Boolean).join(' '),status:r.status,committed:r.status==='resolved'?[r.message]:[],pending:r.status==='resolved'?r.receiptPending||[]:[r.message||'No changes committed.'],details:r.receiptDetails||[],undo:'ask-dm'});}
 function render(root,raw){if(!root)return;const r=model(raw),el=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;},box=el('section','');box.className='action-receipt';box.dataset.status=r.status;box.append(el('strong',r.title+' · '+labels[r.status]));if(r.committed.length)box.append(el('p','Committed: '+r.committed.join(' · ').slice(0,360))); if(!r.committed.length)box.append(el('p',r.status==='undone'?'Previous changes reversed.':r.status==='failed'?'Commit not confirmed; check current state before retry.':'No effects committed.'));box.append(el('p','Still open: '+(r.pending.join(' · ')||'No further ruling recorded.')));box.append(el('small',({available:'Undo available',conditional:'Undo available if later changes do not conflict', 'ask-dm':'Ask the DM to undo; later changes may need review',unavailable:'No resolution to undo'})[r.undo]));if(r.details.length||r.committed.join(' · ').length>360){const d=el('details','');d.append(el('summary','Math & sources'));if(r.committed.join(' · ').length>360)for(const value of r.committed)d.append(el('p',value));for(const value of r.details)d.append(el('p',value));box.append(d);}root.append(box);return box;}
 let scope='',history=[];
 function setScope(key){if(scope===key)return;scope=key;history=[];if(typeof document!=='undefined')document.getElementById('dm-action-receipts')?.remove();}
 function show(raw,key=scope){if(typeof document==='undefined')return;setScope(key);const r=model(raw);history.unshift(r);history=history.slice(0,30);const parent=document.getElementById('dm-feedback');if(!parent)return;let root=document.getElementById('dm-action-receipts');if(!root){root=document.createElement('details');root.id='dm-action-receipts';parent.prepend(root);}root.replaceChildren();const heading=document.createElement('summary');heading.textContent=r.title+' · '+labels[r.status]+' · result';root.append(heading);render(root,r);if(history.length>1){const d=document.createElement('details'),h=document.createElement('summary');h.textContent='Earlier results this visit';d.append(h);for(const old of history.slice(1))render(d,old);root.append(d);}root.open=true;}
 globalThis.ECHO_ACTION_RECEIPTS={model,combat,inventory,render,show,setScope};
})();
